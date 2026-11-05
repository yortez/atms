<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AlumniProfile;
use App\Models\Announcement;
use App\Models\Employer;
use App\Models\JobApplication;
use App\Models\JobPosting;
use App\Models\Survey;
use App\Models\SurveyResponse;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Query\Builder as QueryBuilder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

class DashboardStatsController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $user = $request->user();
        Gate::forUser($user)->authorize('viewDashboard');

        $role = $this->roleCode($user);
        [$metrics, $employmentOutcomes] = match ($role) {
            'alumni' => [$this->alumniMetrics($user), $this->alumniEmploymentOutcomes($user)],
            'employer' => [$this->employerMetrics($user), collect()],
            default => [
                $this->staffMetrics($user, $role === 'department-coordinator'),
                $this->staffEmploymentOutcomes(
                    $user,
                    $role === 'department-coordinator',
                ),
            ],
        };

        return response()->json(['data' => [
            'role' => $role,
            'metrics' => $metrics,
            'employment_outcomes' => $employmentOutcomes,
        ]]);
    }

    /**
     * @return array<string, mixed>
     */
    private function staffMetrics(User $user, bool $isDepartmentCoordinator): array
    {
        $alumni = AlumniProfile::query();
        $users = User::query();
        $surveys = Survey::query();
        $surveyResponses = SurveyResponse::query();

        if ($isDepartmentCoordinator) {
            $alumni->whereIn('id', $this->assignedProfileIds($user));
            $users->whereIn('alumni_profile_id', $this->assignedProfileIds($user));
            $surveys->whereHas('responses', fn (Builder $responses) => $responses
                ->whereIn('alumni_profile_id', $this->assignedProfileIds($user)));
            $surveyResponses->whereIn(
                'alumni_profile_id',
                $this->assignedProfileIds($user),
            );
        }

        return [
            'alumni_count' => $alumni->count(),
            'users_count' => $users->count(),
            'survey_count' => $surveys->count(),
            'survey_response_count' => $surveyResponses->count(),
            'announcements_published_count' => $this->visibleAnnouncements($user)->count(),
            'employers' => [
                'total' => $isDepartmentCoordinator ? 0 : Employer::query()->count(),
                'verified' => $isDepartmentCoordinator
                    ? 0
                    : Employer::query()->where('verification_status', 'verified')->count(),
                'pending' => $isDepartmentCoordinator
                    ? 0
                    : Employer::query()->where('verification_status', 'pending')->count(),
            ],
            'jobs' => [
                'total' => $isDepartmentCoordinator ? 0 : JobPosting::query()->count(),
                'published' => $isDepartmentCoordinator
                    ? 0
                    : JobPosting::query()->where('status', 'published')->count(),
            ],
            'applications' => $isDepartmentCoordinator
                ? ['total' => 0, 'by_status' => collect()]
                : [
                    'total' => JobApplication::query()->count(),
                    'by_status' => JobApplication::query()->select('status')
                        ->selectRaw('COUNT(*) as count')->groupBy('status')->orderBy('status')->get(),
                ],
        ];
    }

    private function assignedProfileIds(User $user): QueryBuilder
    {
        return DB::table('alumni_education_records as education')
            ->join('program_degrees', 'program_degrees.id', '=', 'education.program_degree_id')
            ->whereIn(
                'program_degrees.program_id',
                DB::table('user_program_assignments')
                    ->where('user_id', $user->id)
                    ->select('program_id'),
            )
            ->select('education.alumni_profile_id')
            ->distinct();
    }

    /**
     * @return array<string, mixed>
     */
    private function alumniMetrics(User $user): array
    {
        $profileId = $user->alumni_profile_id;
        $openJobCount = $this->openJobs()->count();

        return [
            'alumni_count' => $profileId === null
                ? 0
                : AlumniProfile::query()->whereKey($profileId)->count(),
            'users_count' => 0,
            'survey_count' => Survey::query()
                ->where('status', 'published')
                ->where(fn ($query) => $query->whereNull('closes_at')->orWhereDate('closes_at', '>=', today()))
                ->count(),
            'survey_response_count' => $profileId === null
                ? 0
                : SurveyResponse::query()->where('alumni_profile_id', $profileId)->count(),
            'announcements_published_count' => $this->visibleAnnouncements($user)->count(),
            'employers' => ['total' => 0, 'verified' => 0, 'pending' => 0],
            'jobs' => [
                'total' => $openJobCount,
                'published' => $openJobCount,
            ],
            'applications' => $this->applicationMetrics(
                JobApplication::query()->where('applicant_user_id', $user->id),
            ),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function employerMetrics(User $user): array
    {
        $employerIds = Employer::query()
            ->whereHas('users', fn ($query) => $query->whereKey($user->id))
            ->select('id');
        $ownedJobs = JobPosting::query()->whereIn('employer_id', $employerIds);
        $ownedApplications = JobApplication::query()->whereHas(
            'jobPosting',
            fn ($query) => $query->whereIn('employer_id', $employerIds),
        );

        return [
            'alumni_count' => 0,
            'users_count' => 0,
            'survey_count' => 0,
            'survey_response_count' => 0,
            'announcements_published_count' => 0,
            'employers' => [
                'total' => Employer::query()->whereIn('id', $employerIds)->count(),
                'verified' => Employer::query()->whereIn('id', $employerIds)
                    ->where('verification_status', 'verified')->count(),
                'pending' => Employer::query()->whereIn('id', $employerIds)
                    ->where('verification_status', 'pending')->count(),
            ],
            'jobs' => [
                'total' => $ownedJobs->count(),
                'published' => (clone $ownedJobs)->where('status', 'published')->count(),
            ],
            'applications' => $this->applicationMetrics($ownedApplications),
        ];
    }

    /**
     * @param  Builder<JobApplication>  $query
     * @return array{total: int, by_status: Collection<int, \stdClass>}
     */
    private function applicationMetrics(Builder $query): array
    {
        $statusQuery = (clone $query)->toBase();

        return [
            'total' => (clone $query)->toBase()->count(),
            'by_status' => $statusQuery->select('status')
                ->selectRaw('COUNT(*) as count')->groupBy('status')->orderBy('status')->get(),
        ];
    }

    /**
     * @return Builder<Announcement>
     */
    private function visibleAnnouncements(User $user): Builder
    {
        $roles = $user->roles()->pluck('name')->all();

        return Announcement::query()
            ->where('status', 'published')
            ->whereNotNull('published_at')
            ->where('published_at', '<=', now())
            ->where(function ($query) use ($roles): void {
                $query->whereNull('audience_roles');
                foreach ($roles as $role) {
                    $query->orWhereJsonContains('audience_roles', $role);
                }
            });
    }

    /**
     * @return Builder<JobPosting>
     */
    private function openJobs(): Builder
    {
        return JobPosting::query()
            ->where('status', 'published')
            ->whereHas('employer', fn ($query) => $query->where('verification_status', 'verified'))
            ->where(fn ($query) => $query->whereNull('closes_at')->orWhereDate('closes_at', '>=', today()));
    }

    /**
     * @return Collection<int, \stdClass>
     */
    private function staffEmploymentOutcomes(
        User $user,
        bool $isDepartmentCoordinator,
    ): Collection {
        $query = $this->latestEmploymentOutcomes();
        if ($isDepartmentCoordinator) {
            $programIds = DB::table('user_program_assignments')
                ->where('user_id', $user->id)
                ->select('program_id');
            $query->whereIn('records.alumni_id', function ($subquery) use ($programIds): void {
                $subquery->select('education.alumni_profile_id')
                    ->from('alumni_education_records as education')
                    ->join('program_degrees', 'program_degrees.id', '=', 'education.program_degree_id')
                    ->whereIn('program_degrees.program_id', $programIds);
            });
        }

        return $query->orderBy('employment_statuses.label')->get();
    }

    /**
     * @return Collection<int, \stdClass>
     */
    private function alumniEmploymentOutcomes(User $user): Collection
    {
        if ($user->alumni_profile_id === null) {
            return collect();
        }

        return $this->latestEmploymentOutcomes()
            ->where('records.alumni_id', $user->alumni_profile_id)
            ->orderBy('employment_statuses.label')
            ->get();
    }

    private function latestEmploymentOutcomes(): QueryBuilder
    {
        return DB::table('alumni_employment_records as records')
            ->joinSub(
                DB::table('alumni_employment_records')->selectRaw('MAX(id) as id')->groupBy('alumni_id'),
                'latest',
                fn ($join) => $join->on('latest.id', '=', 'records.id'),
            )
            ->join('employment_statuses', 'employment_statuses.id', '=', 'records.employment_status_id')
            ->select('employment_statuses.code', 'employment_statuses.label')
            ->selectRaw('COUNT(DISTINCT records.alumni_id) as alumni_count')
            ->groupBy('employment_statuses.id', 'employment_statuses.code', 'employment_statuses.label');
    }

    private function roleCode(User $user): string
    {
        $role = $user->roles()
            ->orderByRaw("CASE roles.name
                WHEN 'system-administrator' THEN 1
                WHEN 'alumni-coordinator' THEN 2
                WHEN 'department-coordinator' THEN 3
                WHEN 'employer' THEN 4
                WHEN 'alumni' THEN 5
                ELSE 6
            END")
            ->orderBy('roles.id')
            ->value('name');

        abort_unless(is_string($role), 403);

        return $role;
    }
}
