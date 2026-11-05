<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Employer;
use App\Models\JobApplication;
use App\Models\JobPosting;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class JobController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        abort_unless($request->user()->hasRole('alumni'), 403);

        return response()->json([
            'data' => JobPosting::query()->where('status', 'published')
                ->whereHas('employer', fn ($query) => $query->where('verification_status', 'verified'))
                ->where(fn ($query) => $query->whereNull('closes_at')->orWhereDate('closes_at', '>=', today()))
                ->with('employer:id,company_name,industry,website')
                ->latest('published_at')->paginate(25),
        ]);
    }

    public function show(Request $request, JobPosting $jobPosting): JsonResponse
    {
        abort_unless(
            ($jobPosting->status === 'published' && $jobPosting->employer->verification_status === 'verified')
                || $this->isMember($request, $jobPosting->employer)
                || $this->isStaff($request),
            404,
        );

        return response()->json(['data' => $jobPosting->load('employer:id,company_name,industry,website')]);
    }

    public function employerIndex(Request $request): JsonResponse
    {
        $employers = $this->memberEmployers($request);

        return response()->json([
            'data' => JobPosting::query()->whereIn('employer_id', $employers->pluck('id'))
                ->with('employer:id,company_name')->withCount('applications')->latest()->paginate(25),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validateJob($request, true);
        $employer = Employer::query()->findOrFail((int) $data['employer_id']);
        abort_unless($this->isMember($request, $employer) || $this->isStaff($request), 403);
        unset($data['employer_id']);

        $job = $employer->jobs()->create($data);

        return response()->json(['data' => $job], 201);
    }

    public function update(Request $request, JobPosting $jobPosting): JsonResponse
    {
        $this->authorizeJob($request, $jobPosting);
        $data = $this->validateJob($request, false);
        unset($data['employer_id']);
        $jobPosting->fill($data)->save();

        return response()->json(['data' => $jobPosting->refresh()]);
    }

    public function destroy(Request $request, JobPosting $jobPosting): JsonResponse
    {
        $this->authorizeJob($request, $jobPosting);
        abort_if($jobPosting->applications()->exists(), 409, 'A posting with applications cannot be deleted.');
        $jobPosting->delete();

        return response()->json(['message' => 'Job posting deleted.']);
    }

    public function publish(Request $request, JobPosting $jobPosting): JsonResponse
    {
        $this->authorizeJob($request, $jobPosting);
        abort_unless($jobPosting->employer->verification_status === 'verified', 403, 'Only verified employers can publish job postings.');
        abort_if($jobPosting->closes_at && $jobPosting->closes_at->lt(today()), 422, 'The closing date has passed.');
        $jobPosting->forceFill(['status' => 'published', 'published_at' => now()])->save();

        return response()->json(['data' => $jobPosting]);
    }

    public function apply(Request $request, JobPosting $jobPosting): JsonResponse
    {
        $user = $request->user();
        abort_unless($user->hasRole('alumni') && $user->alumni_profile_id, 403, 'Applications require a linked alumni profile.');
        abort_unless(
            $jobPosting->status === 'published'
                && $jobPosting->employer->verification_status === 'verified'
                && (! $jobPosting->closes_at || $jobPosting->closes_at->gte(today())),
            404,
        );

        $data = $request->validate(['cover_letter' => ['nullable', 'string', 'max:10000']]);
        abort_if(
            JobApplication::query()->where('job_posting_id', $jobPosting->id)
                ->where('alumni_profile_id', $user->alumni_profile_id)->exists(),
            409,
            'You have already applied to this posting.',
        );

        $application = JobApplication::create([
            'job_posting_id' => $jobPosting->id,
            'alumni_profile_id' => $user->alumni_profile_id,
            'applicant_user_id' => $user->id,
            'cover_letter' => $data['cover_letter'] ?? null,
            'status' => 'submitted',
        ]);

        return response()->json(['data' => $application], 201);
    }

    public function myApplications(Request $request): JsonResponse
    {
        abort_unless($request->user()->hasRole('alumni') && $request->user()->alumni_profile_id, 403);

        return response()->json([
            'data' => JobApplication::query()->where('applicant_user_id', $request->user()->id)
                ->with('jobPosting:id,employer_id,title,location,status', 'jobPosting.employer:id,company_name')
                ->latest()->paginate(25),
        ]);
    }

    public function applications(Request $request, JobPosting $jobPosting): JsonResponse
    {
        $this->authorizeJob($request, $jobPosting);

        return response()->json([
            'data' => $jobPosting->applications()->with('alumniProfile:id,name,first_name,last_name,email')
                ->latest()->paginate(25),
        ]);
    }

    public function reviewApplication(Request $request, JobApplication $application): JsonResponse
    {
        $this->authorizeJob($request, $application->jobPosting);
        $data = $request->validate([
            'status' => ['required', Rule::in(['reviewing', 'shortlisted', 'rejected', 'hired'])],
        ]);
        $application->forceFill([
            ...$data,
            'reviewed_at' => now(),
            'reviewed_by_user_id' => $request->user()->id,
        ])->save();

        return response()->json(['data' => $application->refresh()]);
    }

    /**
     * @return array<string, mixed>
     */
    private function validateJob(Request $request, bool $creating): array
    {
        return $request->validate([
            'employer_id' => $creating
                ? ['required', 'integer', 'exists:employers,id']
                : ['prohibited'],
            'title' => [$creating ? 'required' : 'sometimes', 'string', 'max:180'],
            'description' => [$creating ? 'required' : 'sometimes', 'string', 'max:50000'],
            'location' => ['sometimes', 'nullable', 'string', 'max:180'],
            'employment_type' => ['sometimes', 'nullable', Rule::in(['full-time', 'part-time', 'contract', 'internship', 'temporary'])],
            'workplace_type' => ['sometimes', 'nullable', Rule::in(['onsite', 'hybrid', 'remote'])],
            'salary_min' => ['sometimes', 'nullable', 'numeric', 'min:0', 'max:9999999999.99'],
            'salary_max' => ['sometimes', 'nullable', 'numeric', 'min:0', 'max:9999999999.99', 'gte:salary_min'],
            'closes_at' => ['sometimes', 'nullable', 'date', 'after_or_equal:today'],
        ]);
    }

    /**
     * @return Collection<int, Employer>
     */
    private function memberEmployers(Request $request): Collection
    {
        abort_unless($request->user()->hasRole('employer'), 403);
        $employers = Employer::query()->whereHas('users', fn ($query) => $query->whereKey($request->user()->id))->get();
        abort_if($employers->isEmpty(), 403, 'An employer membership is required.');

        return $employers;
    }

    private function authorizeJob(Request $request, JobPosting $job): void
    {
        abort_unless($this->isMember($request, $job->employer) || $this->isStaff($request), 403);
    }

    private function isMember(Request $request, Employer $employer): bool
    {
        return $request->user()->hasRole('employer')
            && $employer->users()->whereKey($request->user()->id)->exists();
    }

    private function isStaff(Request $request): bool
    {
        return Gate::forUser($request->user())->allows('manageJobs');
    }
}
