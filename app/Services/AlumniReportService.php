<?php

namespace App\Services;

use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Query\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use stdClass;

class AlumniReportService
{
    public const EMPLOYED_STATUS_CODES = [
        'employed',
        'self-employed',
        'government-employee',
        'freelance',
    ];

    /**
     * Catalog of all 18 institutional reports required in Section 12.
     *
     * @return array<string, array{number: int, title: string, category: string, description: string}>
     */
    public function reportCatalog(): array
    {
        return [
            'alumni_masterlist' => [
                'number' => 1,
                'title' => 'Alumni Masterlist',
                'category' => 'Population & Directory',
                'description' => 'Complete directory of alumni records with academic program, graduation cohort, employment status, and account claim state.',
            ],
            'population_by_department' => [
                'number' => 2,
                'title' => 'Alumni Population by Department',
                'category' => 'Population & Directory',
                'description' => 'Distribution of alumni records, academic programs, and claimed portal accounts across academic departments.',
            ],
            'population_by_program' => [
                'number' => 3,
                'title' => 'Alumni Population by Academic Program',
                'category' => 'Population & Directory',
                'description' => 'Graduate population breakdown by degree program and department share.',
            ],
            'population_by_graduation_year' => [
                'number' => 4,
                'title' => 'Alumni Population by Graduation Year',
                'category' => 'Population & Directory',
                'description' => 'Historical cohort sizes, portal claim rates, and employment coverage by graduating class.',
            ],
            'employment_rate' => [
                'number' => 5,
                'title' => 'Employment Rate',
                'category' => 'Employment & Tracer',
                'description' => 'Institution-wide graduate employment rate and distribution across employment status classifications.',
            ],
            'employment_rate_by_program' => [
                'number' => 6,
                'title' => 'Employment Rate by Academic Program',
                'category' => 'Employment & Tracer',
                'description' => 'Comparative employment outcomes, unemployment counts, and further studies rates across academic programs.',
            ],
            'employment_rate_by_graduation_year' => [
                'number' => 7,
                'title' => 'Employment Rate by Graduation Year',
                'category' => 'Employment & Tracer',
                'description' => 'Longitudinal employment rates and degree-related alignment across graduating classes.',
            ],
            'employment_related_to_degree' => [
                'number' => 8,
                'title' => 'Employment Related to Degree',
                'category' => 'Employment & Tracer',
                'description' => 'Self-reported curriculum relevance (Option B) measuring alignment between college degrees and current roles.',
            ],
            'first_employment_statistics' => [
                'number' => 9,
                'title' => 'First Employment Statistics',
                'category' => 'Employment & Tracer',
                'description' => 'Analysis of graduates’ initial career entry roles, industries, employment types, and degree alignment.',
            ],
            'average_time_to_first_employment' => [
                'number' => 10,
                'title' => 'Average Time to First Employment',
                'category' => 'Employment & Tracer',
                'description' => 'Average duration in months from graduation to first recorded employment across academic programs.',
            ],
            'further_studies_statistics' => [
                'number' => 11,
                'title' => 'Further Studies Statistics',
                'category' => 'Employment & Tracer',
                'description' => 'Graduates pursuing advanced degrees, graduate school, or post-baccalaureate academic programs.',
            ],
            'employment_history' => [
                'number' => 12,
                'title' => 'Employment History',
                'category' => 'Employment & Tracer',
                'description' => 'Chronological career progression log across alumni, employers, industries, and locations.',
            ],
            'survey_participation_rate' => [
                'number' => 13,
                'title' => 'Survey Participation Rate',
                'category' => 'Surveys & Engagement',
                'description' => 'Response rates and unique alumnus participation metrics across tracer and institutional surveys.',
            ],
            'survey_response_summary' => [
                'number' => 14,
                'title' => 'Survey Response Summary',
                'category' => 'Surveys & Engagement',
                'description' => 'Question-level aggregation and top response insights from submitted alumni survey responses.',
            ],
            'job_portal_analytics' => [
                'number' => 15,
                'title' => 'Job Portal Analytics',
                'category' => 'Job Portal & Placements',
                'description' => 'Employer partner activity, job postings by workplace and employment type, and applicant demand.',
            ],
            'job_application_statistics' => [
                'number' => 16,
                'title' => 'Job Application Statistics',
                'category' => 'Job Portal & Placements',
                'description' => 'Application funnel conversion metrics across submitted, shortlisted, interviewed, and hired stages.',
            ],
            'successful_job_placements' => [
                'number' => 17,
                'title' => 'Successful Job Placements',
                'category' => 'Job Portal & Placements',
                'description' => 'Verified alumni hires resulting from job portal applications across partner employers and programs.',
            ],
            'graduate_tracer_summary' => [
                'number' => 18,
                'title' => 'Graduate Tracer Summary',
                'category' => 'Employment & Tracer',
                'description' => 'Executive institutional tracer rollup combining population, claim rate, employment rate, degree alignment, surveys, and placements.',
            ],
        ];
    }

    /**
     * Backward-compatible employment outcomes query used by existing API tests and widgets.
     *
     * @return Collection<int, stdClass>
     */
    public function employmentOutcomes(User $viewer, ?int $programId = null, ?int $graduationYear = null): Collection
    {
        $latestEmploymentRecordIds = DB::table('alumni_employment_records')
            ->selectRaw('MAX(id) as id')
            ->groupBy('alumni_id');

        $query = DB::table('alumni_employment_records')
            ->joinSub($latestEmploymentRecordIds, 'latest_records', function ($join): void {
                $join->on('latest_records.id', '=', 'alumni_employment_records.id');
            })
            ->join('employment_statuses', 'employment_statuses.id', '=', 'alumni_employment_records.employment_status_id')
            ->join('alumni_education_records', 'alumni_education_records.alumni_profile_id', '=', 'alumni_employment_records.alumni_id')
            ->join('program_degrees', 'program_degrees.id', '=', 'alumni_education_records.program_degree_id')
            ->selectRaw('alumni_education_records.graduation_year as graduation_year, employment_statuses.label as status, COUNT(DISTINCT alumni_employment_records.alumni_id) as alumni_count, SUM(CASE WHEN alumni_employment_records.is_related_to_degree = 1 THEN 1 ELSE 0 END) as related_count')
            ->whereNotNull('alumni_education_records.graduation_year')
            ->groupBy('alumni_education_records.graduation_year', 'employment_statuses.id', 'employment_statuses.label');

        if ($programId !== null) {
            $query->where('program_degrees.program_id', $programId);
        }

        if ($graduationYear !== null) {
            $query->where('alumni_education_records.graduation_year', $graduationYear);
        }

        if ($this->isDepartmentCoordinatorOnly($viewer)) {
            $query->whereIn('program_degrees.program_id', $this->assignedProgramIdsQuery($viewer));
        }

        return $query->orderBy('graduation_year')->orderBy('status')->get();
    }

    /**
     * @return Collection<int, stdClass>
     */
    public function degreeRelevanceOutcomes(User $viewer, ?int $programId = null, ?int $graduationYear = null): Collection
    {
        $latestEmploymentRecordIds = DB::table('alumni_employment_records')
            ->selectRaw('MAX(id) as id')
            ->groupBy('alumni_id');

        $query = DB::table('alumni_employment_records')
            ->joinSub($latestEmploymentRecordIds, 'latest_records', function ($join): void {
                $join->on('latest_records.id', '=', 'alumni_employment_records.id');
            })
            ->join('alumni_education_records', 'alumni_education_records.alumni_profile_id', '=', 'alumni_employment_records.alumni_id')
            ->join('program_degrees', 'program_degrees.id', '=', 'alumni_education_records.program_degree_id')
            ->selectRaw('alumni_education_records.graduation_year as graduation_year, alumni_employment_records.is_related_to_degree, COUNT(DISTINCT alumni_employment_records.alumni_id) as alumni_count')
            ->whereNotNull('alumni_education_records.graduation_year')
            ->groupBy('alumni_education_records.graduation_year', 'alumni_employment_records.is_related_to_degree');

        if ($programId !== null) {
            $query->where('program_degrees.program_id', $programId);
        }

        if ($graduationYear !== null) {
            $query->where('alumni_education_records.graduation_year', $graduationYear);
        }

        if ($this->isDepartmentCoordinatorOnly($viewer)) {
            $query->whereIn('program_degrees.program_id', $this->assignedProgramIdsQuery($viewer));
        }

        return $query->orderBy('graduation_year')->get();
    }

    /**
     * Generate any of the 18 institutional reports with unified filtering and Option A scoping.
     *
     * @param  array{
     *     department_id?: int|null,
     *     program_id?: int|null,
     *     graduation_year?: int|null,
     *     employment_status?: string|null,
     *     date_from?: string|null,
     *     date_to?: string|null
     * }  $filters
     * @return array<string, mixed>
     */
    public function generateReport(User $viewer, string $reportType = 'graduate_tracer_summary', array $filters = []): array
    {
        $catalog = $this->reportCatalog();
        if (! isset($catalog[$reportType])) {
            $reportType = 'graduate_tracer_summary';
        }

        $normalizedFilters = [
            'department_id' => isset($filters['department_id']) && $filters['department_id'] !== '' ? (int) $filters['department_id'] : null,
            'program_id' => isset($filters['program_id']) && $filters['program_id'] !== '' ? (int) $filters['program_id'] : null,
            'graduation_year' => isset($filters['graduation_year']) && $filters['graduation_year'] !== '' ? (int) $filters['graduation_year'] : null,
            'employment_status' => isset($filters['employment_status']) && $filters['employment_status'] !== '' ? (string) $filters['employment_status'] : null,
            'date_from' => isset($filters['date_from']) && $filters['date_from'] !== '' ? (string) $filters['date_from'] : null,
            'date_to' => isset($filters['date_to']) && $filters['date_to'] !== '' ? (string) $filters['date_to'] : null,
        ];

        $reportData = match ($reportType) {
            'alumni_masterlist' => $this->buildAlumniMasterlist($viewer, $normalizedFilters),
            'population_by_department' => $this->buildPopulationByDepartment($viewer, $normalizedFilters),
            'population_by_program' => $this->buildPopulationByProgram($viewer, $normalizedFilters),
            'population_by_graduation_year' => $this->buildPopulationByGraduationYear($viewer, $normalizedFilters),
            'employment_rate' => $this->buildEmploymentRate($viewer, $normalizedFilters),
            'employment_rate_by_program' => $this->buildEmploymentRateByProgram($viewer, $normalizedFilters),
            'employment_rate_by_graduation_year' => $this->buildEmploymentRateByGraduationYear($viewer, $normalizedFilters),
            'employment_related_to_degree' => $this->buildEmploymentRelatedToDegree($viewer, $normalizedFilters),
            'first_employment_statistics' => $this->buildFirstEmploymentStatistics($viewer, $normalizedFilters),
            'average_time_to_first_employment' => $this->buildAverageTimeToFirstEmployment($viewer, $normalizedFilters),
            'further_studies_statistics' => $this->buildFurtherStudiesStatistics($viewer, $normalizedFilters),
            'employment_history' => $this->buildEmploymentHistory($viewer, $normalizedFilters),
            'survey_participation_rate' => $this->buildSurveyParticipationRate($viewer, $normalizedFilters),
            'survey_response_summary' => $this->buildSurveyResponseSummary($viewer, $normalizedFilters),
            'job_portal_analytics' => $this->buildJobPortalAnalytics($viewer, $normalizedFilters),
            'job_application_statistics' => $this->buildJobApplicationStatistics($viewer, $normalizedFilters),
            'successful_job_placements' => $this->buildSuccessfulJobPlacements($viewer, $normalizedFilters),
            default => $this->buildGraduateTracerSummary($viewer, $normalizedFilters),
        };

        $meta = $catalog[$reportType];

        return [
            'report_type' => $reportType,
            'number' => $meta['number'],
            'title' => $meta['title'],
            'category' => $meta['category'],
            'description' => $meta['description'],
            'generated_at' => now()->toIso8601String(),
            'filters' => $normalizedFilters,
            'filter_options' => $this->filterOptions($viewer),
            'available_reports' => collect($catalog)->map(fn (array $item, string $key) => [
                'key' => $key,
                'number' => $item['number'],
                'title' => $item['title'],
                'category' => $item['category'],
                'description' => $item['description'],
            ])->values()->all(),
            'cards' => $reportData['cards'],
            'chart' => $reportData['chart'],
            'columns' => $reportData['columns'],
            'rows' => $reportData['rows'],
        ];
    }

    /**
     * Filter dropdown options scoped to the viewer's accessible programs.
     *
     * @return array<string, mixed>
     */
    public function filterOptions(User $viewer): array
    {
        $isScoped = $this->isDepartmentCoordinatorOnly($viewer);

        $programsQuery = DB::table('academic_programs')
            ->select('id', 'department_id', 'code', 'name')
            ->orderBy('name');

        if ($isScoped) {
            $programsQuery->whereIn('id', $this->assignedProgramIdsQuery($viewer));
        }

        $programs = $programsQuery->get();

        $departmentsQuery = DB::table('departments')
            ->select('id', 'code', 'name')
            ->orderBy('name');

        if ($isScoped) {
            $deptIds = $programs->pluck('department_id')->unique()->values()->all();
            $departmentsQuery->whereIn('id', $deptIds ?: [0]);
        }

        $yearsQuery = DB::table('alumni_education_records as edu')
            ->leftJoin('program_degrees as pd', 'pd.id', '=', 'edu.program_degree_id')
            ->whereNotNull('edu.graduation_year')
            ->select('edu.graduation_year')
            ->distinct()
            ->orderByDesc('edu.graduation_year');

        if ($isScoped) {
            $yearsQuery->whereIn('pd.program_id', $this->assignedProgramIdsQuery($viewer));
        }

        $statuses = DB::table('employment_statuses')
            ->where('is_active', true)
            ->select('id', 'code', 'label')
            ->orderBy('label')
            ->get();

        return [
            'departments' => $departmentsQuery->get(),
            'programs' => $programs,
            'graduation_years' => $yearsQuery->pluck('graduation_year')->values()->all(),
            'employment_statuses' => $statuses,
        ];
    }

    /**
     * Build a base query of alumni education + profile + latest employment records with all 5 filters & Option A scoping.
     */
    private function baseScopedAlumniQuery(User $viewer, array $filters): Builder
    {
        $latestEmpIds = DB::table('alumni_employment_records')
            ->selectRaw('alumni_id, MAX(id) as max_id')
            ->groupBy('alumni_id');

        $query = DB::table('alumni_profiles as ap')
            ->leftJoin('alumni_education_records as edu', 'edu.alumni_profile_id', '=', 'ap.id')
            ->leftJoin('program_degrees as pd', 'pd.id', '=', 'edu.program_degree_id')
            ->leftJoin('academic_programs as prog', 'prog.id', '=', 'pd.program_id')
            ->leftJoin('departments as dept', 'dept.id', '=', 'prog.department_id')
            ->leftJoin('degrees as deg', 'deg.id', '=', 'pd.degree_id')
            ->leftJoin('users as u', 'u.alumni_profile_id', '=', 'ap.id')
            ->leftJoinSub($latestEmpIds, 'latest_emp_id', function ($join): void {
                $join->on('latest_emp_id.alumni_id', '=', 'ap.id');
            })
            ->leftJoin('alumni_employment_records as emp', 'emp.id', '=', 'latest_emp_id.max_id')
            ->leftJoin('employment_statuses as es', 'es.id', '=', 'emp.employment_status_id');

        if ($this->isDepartmentCoordinatorOnly($viewer)) {
            $query->whereIn('pd.program_id', $this->assignedProgramIdsQuery($viewer));
        }

        if ($filters['department_id'] !== null) {
            $query->where('prog.department_id', $filters['department_id']);
        }

        if ($filters['program_id'] !== null) {
            $query->where('pd.program_id', $filters['program_id']);
        }

        if ($filters['graduation_year'] !== null) {
            $query->where('edu.graduation_year', $filters['graduation_year']);
        }

        if ($filters['employment_status'] !== null) {
            $query->where(function ($sub) use ($filters): void {
                $sub->where('es.code', $filters['employment_status'])
                    ->orWhere('es.label', $filters['employment_status']);
            });
        }

        if ($filters['date_from'] !== null) {
            $query->whereDate('ap.created_at', '>=', $filters['date_from']);
        }

        if ($filters['date_to'] !== null) {
            $query->whereDate('ap.created_at', '<=', $filters['date_to']);
        }

        return $query;
    }

    /**
     * 1. Alumni Masterlist
     */
    private function buildAlumniMasterlist(User $viewer, array $filters): array
    {
        $records = $this->baseScopedAlumniQuery($viewer, $filters)
            ->select([
                'ap.id as alumni_id',
                'ap.name as alumni_name',
                'ap.email',
                'edu.student_number',
                'dept.name as department_name',
                'prog.code as program_code',
                'prog.name as program_name',
                'edu.graduation_year',
                'edu.honors',
                'edu.gwa',
                'es.code as status_code',
                'es.label as status_label',
                'emp.job_title',
                'emp.employer_name',
                'u.id as user_id',
            ])
            ->orderBy('ap.name')
            ->orderByDesc('edu.graduation_year')
            ->get();

        $uniqueAlumni = $records->unique('alumni_id');
        $totalAlumni = $uniqueAlumni->count();
        $claimedCount = $uniqueAlumni->filter(fn ($r) => $r->user_id !== null)->count();
        $employedCount = $uniqueAlumni->filter(fn ($r) => $this->isEmployedCode($r->status_code, $r->status_label))->count();
        $honorsCount = $records->filter(fn ($r) => ! empty($r->honors))->unique('alumni_id')->count();

        $byProgram = $records->groupBy(fn ($r) => $r->program_code ?: 'Unassigned')
            ->map(fn (Collection $group, string $code) => [
                'label' => $code,
                'value' => $group->unique('alumni_id')->count(),
            ])->values()->all();

        $rows = $records->map(fn ($r) => [
            'student_number' => $r->student_number ?? '—',
            'alumni_name' => $r->alumni_name,
            'email' => $r->email,
            'department' => $r->department_name ?? '—',
            'program' => $r->program_name ?? '—',
            'graduation_year' => $r->graduation_year ?? '—',
            'honors' => $r->honors ?? '—',
            'gwa' => $r->gwa !== null ? number_format((float) $r->gwa, 2) : '—',
            'employment_status' => $r->status_label ?? 'Untracked',
            'account_status' => $r->user_id !== null ? 'Claimed' : 'Unclaimed',
        ])->values()->all();

        return [
            'cards' => [
                ['label' => 'Total Alumni', 'value' => $totalAlumni, 'hint' => 'Matching filter criteria'],
                ['label' => 'Claimed Accounts', 'value' => $claimedCount, 'hint' => $this->formatPercent($claimedCount, $totalAlumni).' claim rate'],
                ['label' => 'Employed Alumni', 'value' => $employedCount, 'hint' => 'Currently in workforce'],
                ['label' => 'Academic Honors', 'value' => $honorsCount, 'hint' => 'With Latin/academic honors'],
            ],
            'chart' => [
                'title' => 'Masterlist Distribution by Program',
                'type' => 'bar',
                'unit' => 'alumni',
                'series' => $byProgram,
            ],
            'columns' => [
                ['key' => 'student_number', 'label' => 'Student No.'],
                ['key' => 'alumni_name', 'label' => 'Alumnus Name'],
                ['key' => 'email', 'label' => 'Email'],
                ['key' => 'department', 'label' => 'Department'],
                ['key' => 'program', 'label' => 'Academic Program'],
                ['key' => 'graduation_year', 'label' => 'Batch', 'align' => 'right'],
                ['key' => 'honors', 'label' => 'Honors'],
                ['key' => 'gwa', 'label' => 'GWA', 'align' => 'right'],
                ['key' => 'employment_status', 'label' => 'Employment Status'],
                ['key' => 'account_status', 'label' => 'Account'],
            ],
            'rows' => $rows,
        ];
    }

    /**
     * 2. Alumni Population by Department
     */
    private function buildPopulationByDepartment(User $viewer, array $filters): array
    {
        $records = $this->baseScopedAlumniQuery($viewer, $filters)
            ->whereNotNull('dept.id')
            ->select([
                'dept.id as department_id',
                'dept.code as department_code',
                'dept.name as department_name',
                'prog.id as program_id',
                'ap.id as alumni_id',
                'u.id as user_id',
            ])
            ->get();

        $totalAlumni = $records->unique('alumni_id')->count();
        $grouped = $records->groupBy('department_id');

        $rows = $grouped->map(function (Collection $items) use ($totalAlumni): array {
            $first = $items->first();
            $alumniCount = $items->unique('alumni_id')->count();
            $claimedCount = $items->filter(fn ($r) => $r->user_id !== null)->unique('alumni_id')->count();
            $programsCount = $items->pluck('program_id')->filter()->unique()->count();
            $share = $totalAlumni > 0 ? round(($alumniCount / $totalAlumni) * 100, 1) : 0.0;

            return [
                'department_code' => $first->department_code,
                'department_name' => $first->department_name,
                'programs_count' => $programsCount,
                'alumni_count' => $alumniCount,
                'claimed_count' => $claimedCount,
                'share_percentage' => $share.'%',
                '_raw_count' => $alumniCount,
                '_raw_share' => $share,
            ];
        })->sortByDesc('_raw_count')->values();

        $topDept = $rows->first();
        $totalClaimed = $records->filter(fn ($r) => $r->user_id !== null)->unique('alumni_id')->count();

        return [
            'cards' => [
                ['label' => 'Departments', 'value' => $rows->count(), 'hint' => 'Active academic units'],
                ['label' => 'Total Alumni', 'value' => $totalAlumni, 'hint' => 'Across departments'],
                ['label' => 'Largest Department', 'value' => $topDept['department_code'] ?? '—', 'hint' => ($topDept['alumni_count'] ?? 0).' alumni'],
                ['label' => 'Portal Claim Rate', 'value' => $this->formatPercent($totalClaimed, $totalAlumni), 'hint' => $totalClaimed.' claimed accounts'],
            ],
            'chart' => [
                'title' => 'Alumni Population by Department',
                'type' => 'bar',
                'unit' => 'alumni',
                'series' => $rows->map(fn (array $r) => [
                    'label' => $r['department_code'],
                    'value' => $r['alumni_count'],
                    'percentage' => $r['_raw_share'],
                ])->all(),
            ],
            'columns' => [
                ['key' => 'department_code', 'label' => 'Code'],
                ['key' => 'department_name', 'label' => 'Department'],
                ['key' => 'programs_count', 'label' => 'Programs', 'align' => 'right'],
                ['key' => 'alumni_count', 'label' => 'Alumni Population', 'align' => 'right'],
                ['key' => 'claimed_count', 'label' => 'Claimed Accounts', 'align' => 'right'],
                ['key' => 'share_percentage', 'label' => 'Institution Share', 'align' => 'right'],
            ],
            'rows' => $rows->map(fn (array $r) => collect($r)->except(['_raw_count', '_raw_share'])->all())->all(),
        ];
    }

    /**
     * 3. Alumni Population by Academic Program
     */
    private function buildPopulationByProgram(User $viewer, array $filters): array
    {
        $records = $this->baseScopedAlumniQuery($viewer, $filters)
            ->whereNotNull('prog.id')
            ->select([
                'prog.id as program_id',
                'prog.code as program_code',
                'prog.name as program_name',
                'dept.name as department_name',
                'ap.id as alumni_id',
                'u.id as user_id',
            ])
            ->get();

        $totalAlumni = $records->unique('alumni_id')->count();
        $grouped = $records->groupBy('program_id');

        $rows = $grouped->map(function (Collection $items) use ($totalAlumni): array {
            $first = $items->first();
            $alumniCount = $items->unique('alumni_id')->count();
            $claimedCount = $items->filter(fn ($r) => $r->user_id !== null)->unique('alumni_id')->count();
            $share = $totalAlumni > 0 ? round(($alumniCount / $totalAlumni) * 100, 1) : 0.0;

            return [
                'program_code' => $first->program_code,
                'program_name' => $first->program_name,
                'department_name' => $first->department_name ?? '—',
                'alumni_count' => $alumniCount,
                'claimed_count' => $claimedCount,
                'share_percentage' => $share.'%',
                '_raw_count' => $alumniCount,
                '_raw_share' => $share,
            ];
        })->sortByDesc('_raw_count')->values();

        $topProgram = $rows->first();
        $totalClaimed = $records->filter(fn ($r) => $r->user_id !== null)->unique('alumni_id')->count();

        return [
            'cards' => [
                ['label' => 'Academic Programs', 'value' => $rows->count(), 'hint' => 'With alumni records'],
                ['label' => 'Total Alumni', 'value' => $totalAlumni, 'hint' => 'Enrolled in degree programs'],
                ['label' => 'Top Program', 'value' => $topProgram['program_code'] ?? '—', 'hint' => ($topProgram['alumni_count'] ?? 0).' alumni'],
                ['label' => 'Claimed Accounts', 'value' => $totalClaimed, 'hint' => $this->formatPercent($totalClaimed, $totalAlumni).' claim rate'],
            ],
            'chart' => [
                'title' => 'Alumni Population by Academic Program',
                'type' => 'bar',
                'unit' => 'alumni',
                'series' => $rows->map(fn (array $r) => [
                    'label' => $r['program_code'],
                    'value' => $r['alumni_count'],
                    'percentage' => $r['_raw_share'],
                ])->all(),
            ],
            'columns' => [
                ['key' => 'program_code', 'label' => 'Program Code'],
                ['key' => 'program_name', 'label' => 'Academic Program'],
                ['key' => 'department_name', 'label' => 'Department'],
                ['key' => 'alumni_count', 'label' => 'Alumni Population', 'align' => 'right'],
                ['key' => 'claimed_count', 'label' => 'Claimed Accounts', 'align' => 'right'],
                ['key' => 'share_percentage', 'label' => 'Share', 'align' => 'right'],
            ],
            'rows' => $rows->map(fn (array $r) => collect($r)->except(['_raw_count', '_raw_share'])->all())->all(),
        ];
    }

    /**
     * 4. Alumni Population by Graduation Year
     */
    private function buildPopulationByGraduationYear(User $viewer, array $filters): array
    {
        $records = $this->baseScopedAlumniQuery($viewer, $filters)
            ->whereNotNull('edu.graduation_year')
            ->select([
                'edu.graduation_year',
                'ap.id as alumni_id',
                'u.id as user_id',
                'es.code as status_code',
                'es.label as status_label',
            ])
            ->get();

        $totalAlumni = $records->unique('alumni_id')->count();
        $grouped = $records->groupBy('graduation_year');

        $rows = $grouped->map(function (Collection $items, $year) use ($totalAlumni): array {
            $unique = $items->unique('alumni_id');
            $alumniCount = $unique->count();
            $claimedCount = $unique->filter(fn ($r) => $r->user_id !== null)->count();
            $employedCount = $unique->filter(fn ($r) => $this->isEmployedCode($r->status_code, $r->status_label))->count();
            $share = $totalAlumni > 0 ? round(($alumniCount / $totalAlumni) * 100, 1) : 0.0;

            return [
                'graduation_year' => (int) $year,
                'alumni_count' => $alumniCount,
                'claimed_count' => $claimedCount,
                'employed_count' => $employedCount,
                'share_percentage' => $share.'%',
                '_raw_share' => $share,
            ];
        })->sortByDesc('graduation_year')->values();

        $largestCohort = $rows->sortByDesc('alumni_count')->first();
        $latestCohort = $rows->first();

        return [
            'cards' => [
                ['label' => 'Graduation Cohorts', 'value' => $rows->count(), 'hint' => 'Distinct graduating classes'],
                ['label' => 'Total Graduates', 'value' => $totalAlumni, 'hint' => 'Across recorded batches'],
                ['label' => 'Largest Batch', 'value' => $largestCohort['graduation_year'] ?? '—', 'hint' => ($largestCohort['alumni_count'] ?? 0).' graduates'],
                ['label' => 'Latest Batch Size', 'value' => $latestCohort['alumni_count'] ?? 0, 'hint' => 'Class of '.($latestCohort['graduation_year'] ?? '—')],
            ],
            'chart' => [
                'title' => 'Alumni Population by Graduation Year',
                'type' => 'bar',
                'unit' => 'alumni',
                'series' => $rows->sortBy('graduation_year')->values()->map(fn (array $r) => [
                    'label' => (string) $r['graduation_year'],
                    'value' => $r['alumni_count'],
                    'percentage' => $r['_raw_share'],
                ])->all(),
            ],
            'columns' => [
                ['key' => 'graduation_year', 'label' => 'Graduation Year'],
                ['key' => 'alumni_count', 'label' => 'Graduates', 'align' => 'right'],
                ['key' => 'claimed_count', 'label' => 'Claimed Accounts', 'align' => 'right'],
                ['key' => 'employed_count', 'label' => 'Employed', 'align' => 'right'],
                ['key' => 'share_percentage', 'label' => 'Population Share', 'align' => 'right'],
            ],
            'rows' => $rows->map(fn (array $r) => collect($r)->except(['_raw_share'])->all())->all(),
        ];
    }

    /**
     * 5. Employment Rate
     */
    private function buildEmploymentRate(User $viewer, array $filters): array
    {
        $records = $this->baseScopedAlumniQuery($viewer, $filters)
            ->whereNotNull('emp.id')
            ->select([
                'ap.id as alumni_id',
                'es.code as status_code',
                'es.label as status_label',
                'emp.is_related_to_degree',
            ])
            ->get()
            ->unique('alumni_id');

        $totalTracked = $records->count();
        $employedCount = $records->filter(fn ($r) => $this->isEmployedCode($r->status_code, $r->status_label))->count();
        $unemployedCount = $records->filter(fn ($r) => $r->status_code === 'unemployed')->count();
        $employmentRate = $totalTracked > 0 ? round(($employedCount / $totalTracked) * 100, 1) : 0.0;

        $grouped = $records->groupBy('status_label');
        $rows = $grouped->map(function (Collection $items, string $label) use ($totalTracked): array {
            $first = $items->first();
            $count = $items->count();
            $pct = $totalTracked > 0 ? round(($count / $totalTracked) * 100, 1) : 0.0;
            $isEmp = $this->isEmployedCode($first->status_code, $label);

            return [
                'status_label' => $label,
                'status_code' => $first->status_code,
                'category' => $isEmp ? 'In Workforce (Employed)' : 'Non-Workforce / Seeking',
                'alumni_count' => $count,
                'percentage' => $pct.'%',
                '_raw_pct' => $pct,
            ];
        })->sortByDesc('alumni_count')->values();

        return [
            'cards' => [
                ['label' => 'Tracked Alumni', 'value' => $totalTracked, 'hint' => 'With employment records'],
                ['label' => 'Employed Alumni', 'value' => $employedCount, 'hint' => 'Employed, self-employed, gov, freelance'],
                ['label' => 'Employment Rate', 'value' => $employmentRate.'%', 'hint' => 'Of tracked alumni population'],
                ['label' => 'Unemployed', 'value' => $unemployedCount, 'hint' => 'Currently seeking opportunities'],
            ],
            'chart' => [
                'title' => 'Employment Status Breakdown',
                'type' => 'distribution',
                'unit' => '%',
                'series' => $rows->map(fn (array $r) => [
                    'label' => $r['status_label'],
                    'value' => $r['alumni_count'],
                    'percentage' => $r['_raw_pct'],
                ])->all(),
            ],
            'columns' => [
                ['key' => 'status_label', 'label' => 'Employment Status'],
                ['key' => 'category', 'label' => 'Workforce Category'],
                ['key' => 'alumni_count', 'label' => 'Alumni Count', 'align' => 'right'],
                ['key' => 'percentage', 'label' => 'Share of Tracked', 'align' => 'right'],
            ],
            'rows' => $rows->map(fn (array $r) => collect($r)->except(['status_code', '_raw_pct'])->all())->all(),
        ];
    }

    /**
     * 6. Employment Rate by Academic Program
     */
    private function buildEmploymentRateByProgram(User $viewer, array $filters): array
    {
        $records = $this->baseScopedAlumniQuery($viewer, $filters)
            ->whereNotNull('prog.id')
            ->whereNotNull('emp.id')
            ->select([
                'prog.id as program_id',
                'prog.code as program_code',
                'prog.name as program_name',
                'dept.name as department_name',
                'ap.id as alumni_id',
                'es.code as status_code',
                'es.label as status_label',
            ])
            ->get();

        $grouped = $records->groupBy('program_id');

        $rows = $grouped->map(function (Collection $items): array {
            $first = $items->first();
            $unique = $items->unique('alumni_id');
            $tracked = $unique->count();
            $employed = $unique->filter(fn ($r) => $this->isEmployedCode($r->status_code, $r->status_label))->count();
            $unemployed = $unique->filter(fn ($r) => $r->status_code === 'unemployed')->count();
            $furtherStudies = $unique->filter(fn ($r) => $r->status_code === 'further-studies')->count();
            $rate = $tracked > 0 ? round(($employed / $tracked) * 100, 1) : 0.0;

            return [
                'program_code' => $first->program_code,
                'program_name' => $first->program_name,
                'department_name' => $first->department_name ?? '—',
                'tracked_alumni' => $tracked,
                'employed_count' => $employed,
                'unemployed_count' => $unemployed,
                'further_studies_count' => $furtherStudies,
                'employment_rate' => $rate.'%',
                '_raw_rate' => $rate,
            ];
        })->sortByDesc('_raw_rate')->values();

        $uniqueAll = $records->unique('alumni_id');
        $totalTracked = $uniqueAll->count();
        $totalEmployed = $uniqueAll->filter(fn ($r) => $this->isEmployedCode($r->status_code, $r->status_label))->count();
        $overallRate = $totalTracked > 0 ? round(($totalEmployed / $totalTracked) * 100, 1) : 0.0;

        return [
            'cards' => [
                ['label' => 'Programs Evaluated', 'value' => $rows->count(), 'hint' => 'With tracked graduates'],
                ['label' => 'Tracked Graduates', 'value' => $totalTracked, 'hint' => 'Across selected programs'],
                ['label' => 'Total Employed', 'value' => $totalEmployed, 'hint' => 'Active workforce placement'],
                ['label' => 'Overall Employment Rate', 'value' => $overallRate.'%', 'hint' => 'Institution/scope average'],
            ],
            'chart' => [
                'title' => 'Employment Rate (%) by Academic Program',
                'type' => 'bar',
                'unit' => '%',
                'series' => $rows->map(fn (array $r) => [
                    'label' => $r['program_code'],
                    'value' => $r['_raw_rate'],
                    'percentage' => $r['_raw_rate'],
                ])->all(),
            ],
            'columns' => [
                ['key' => 'program_code', 'label' => 'Code'],
                ['key' => 'program_name', 'label' => 'Academic Program'],
                ['key' => 'department_name', 'label' => 'Department'],
                ['key' => 'tracked_alumni', 'label' => 'Tracked', 'align' => 'right'],
                ['key' => 'employed_count', 'label' => 'Employed', 'align' => 'right'],
                ['key' => 'unemployed_count', 'label' => 'Unemployed', 'align' => 'right'],
                ['key' => 'further_studies_count', 'label' => 'Further Studies', 'align' => 'right'],
                ['key' => 'employment_rate', 'label' => 'Employment Rate', 'align' => 'right'],
            ],
            'rows' => $rows->map(fn (array $r) => collect($r)->except(['_raw_rate'])->all())->all(),
        ];
    }

    /**
     * 7. Employment Rate by Graduation Year
     */
    private function buildEmploymentRateByGraduationYear(User $viewer, array $filters): array
    {
        $records = $this->baseScopedAlumniQuery($viewer, $filters)
            ->whereNotNull('edu.graduation_year')
            ->whereNotNull('emp.id')
            ->select([
                'edu.graduation_year',
                'ap.id as alumni_id',
                'es.code as status_code',
                'es.label as status_label',
                'emp.is_related_to_degree',
            ])
            ->get();

        $grouped = $records->groupBy('graduation_year');

        $rows = $grouped->map(function (Collection $items, $year): array {
            $unique = $items->unique('alumni_id');
            $tracked = $unique->count();
            $employed = $unique->filter(fn ($r) => $this->isEmployedCode($r->status_code, $r->status_label))->count();
            $related = $unique->filter(fn ($r) => $this->isEmployedCode($r->status_code, $r->status_label) && (bool) $r->is_related_to_degree)->count();
            $rate = $tracked > 0 ? round(($employed / $tracked) * 100, 1) : 0.0;

            return [
                'graduation_year' => (int) $year,
                'tracked_alumni' => $tracked,
                'employed_count' => $employed,
                'degree_related_count' => $related,
                'employment_rate' => $rate.'%',
                '_raw_rate' => $rate,
            ];
        })->sortByDesc('graduation_year')->values();

        $uniqueAll = $records->unique('alumni_id');
        $totalTracked = $uniqueAll->count();
        $totalEmployed = $uniqueAll->filter(fn ($r) => $this->isEmployedCode($r->status_code, $r->status_label))->count();
        $overallRate = $totalTracked > 0 ? round(($totalEmployed / $totalTracked) * 100, 1) : 0.0;

        return [
            'cards' => [
                ['label' => 'Graduating Classes', 'value' => $rows->count(), 'hint' => 'Cohorts with employment data'],
                ['label' => 'Tracked Graduates', 'value' => $totalTracked, 'hint' => 'Unique alumni tracked'],
                ['label' => 'Employed Graduates', 'value' => $totalEmployed, 'hint' => 'Employed across cohorts'],
                ['label' => 'Overall Rate', 'value' => $overallRate.'%', 'hint' => 'Cohort-wide employment rate'],
            ],
            'chart' => [
                'title' => 'Employment Rate (%) by Graduation Year',
                'type' => 'bar',
                'unit' => '%',
                'series' => $rows->sortBy('graduation_year')->values()->map(fn (array $r) => [
                    'label' => (string) $r['graduation_year'],
                    'value' => $r['_raw_rate'],
                    'percentage' => $r['_raw_rate'],
                ])->all(),
            ],
            'columns' => [
                ['key' => 'graduation_year', 'label' => 'Graduation Year'],
                ['key' => 'tracked_alumni', 'label' => 'Tracked Alumni', 'align' => 'right'],
                ['key' => 'employed_count', 'label' => 'Employed', 'align' => 'right'],
                ['key' => 'degree_related_count', 'label' => 'Degree-Related', 'align' => 'right'],
                ['key' => 'employment_rate', 'label' => 'Employment Rate', 'align' => 'right'],
            ],
            'rows' => $rows->map(fn (array $r) => collect($r)->except(['_raw_rate'])->all())->all(),
        ];
    }

    /**
     * 8. Employment Related to Degree (Option B)
     */
    private function buildEmploymentRelatedToDegree(User $viewer, array $filters): array
    {
        $records = $this->baseScopedAlumniQuery($viewer, $filters)
            ->whereNotNull('emp.id')
            ->select([
                'ap.id as alumni_id',
                'prog.id as program_id',
                'prog.code as program_code',
                'prog.name as program_name',
                'edu.graduation_year',
                'es.code as status_code',
                'es.label as status_label',
                'emp.is_related_to_degree',
            ])
            ->get()
            ->filter(fn ($r) => $this->isEmployedCode($r->status_code, $r->status_label));

        $uniqueEmployed = $records->unique('alumni_id');
        $totalEmployed = $uniqueEmployed->count();
        $relatedTotal = $uniqueEmployed->filter(fn ($r) => (bool) $r->is_related_to_degree)->count();
        $unrelatedTotal = $totalEmployed - $relatedTotal;
        $overallAlignment = $totalEmployed > 0 ? round(($relatedTotal / $totalEmployed) * 100, 1) : 0.0;

        $grouped = $records->groupBy(fn ($r) => $r->program_code ?: 'Unassigned');

        $rows = $grouped->map(function (Collection $items, string $programCode): array {
            $first = $items->first();
            $unique = $items->unique('alumni_id');
            $employed = $unique->count();
            $related = $unique->filter(fn ($r) => (bool) $r->is_related_to_degree)->count();
            $unrelated = $employed - $related;
            $rate = $employed > 0 ? round(($related / $employed) * 100, 1) : 0.0;

            return [
                'program_code' => $programCode,
                'program_name' => $first->program_name ?? 'Unassigned',
                'employed_count' => $employed,
                'related_count' => $related,
                'unrelated_count' => $unrelated,
                'alignment_rate' => $rate.'%',
                '_raw_rate' => $rate,
            ];
        })->sortByDesc('_raw_rate')->values();

        return [
            'cards' => [
                ['label' => 'Employed Evaluated', 'value' => $totalEmployed, 'hint' => 'Active employed graduates'],
                ['label' => 'Degree-Related Roles', 'value' => $relatedTotal, 'hint' => 'Aligned with academic program'],
                ['label' => 'Non-Degree Related', 'value' => $unrelatedTotal, 'hint' => 'Outside primary field of study'],
                ['label' => 'Alignment Rate', 'value' => $overallAlignment.'%', 'hint' => 'Self-reported degree relevance'],
            ],
            'chart' => [
                'title' => 'Degree Alignment Rate (%) by Academic Program',
                'type' => 'bar',
                'unit' => '%',
                'series' => $rows->map(fn (array $r) => [
                    'label' => $r['program_code'],
                    'value' => $r['_raw_rate'],
                    'percentage' => $r['_raw_rate'],
                ])->all(),
            ],
            'columns' => [
                ['key' => 'program_code', 'label' => 'Program Code'],
                ['key' => 'program_name', 'label' => 'Academic Program'],
                ['key' => 'employed_count', 'label' => 'Employed Alumni', 'align' => 'right'],
                ['key' => 'related_count', 'label' => 'Degree-Related', 'align' => 'right'],
                ['key' => 'unrelated_count', 'label' => 'Non-Related', 'align' => 'right'],
                ['key' => 'alignment_rate', 'label' => 'Alignment Rate', 'align' => 'right'],
            ],
            'rows' => $rows->map(fn (array $r) => collect($r)->except(['_raw_rate'])->all())->all(),
        ];
    }

    /**
     * 9. First Employment Statistics
     */
    private function buildFirstEmploymentStatistics(User $viewer, array $filters): array
    {
        $firstEmpIds = DB::table('alumni_employment_records')
            ->selectRaw('MIN(id) as id')
            ->groupBy('alumni_id');

        $query = DB::table('alumni_employment_records as emp')
            ->joinSub($firstEmpIds, 'first_emp', fn ($join) => $join->on('first_emp.id', '=', 'emp.id'))
            ->join('alumni_profiles as ap', 'ap.id', '=', 'emp.alumni_id')
            ->join('employment_statuses as es', 'es.id', '=', 'emp.employment_status_id')
            ->leftJoin('alumni_education_records as edu', 'edu.alumni_profile_id', '=', 'ap.id')
            ->leftJoin('program_degrees as pd', 'pd.id', '=', 'edu.program_degree_id')
            ->leftJoin('academic_programs as prog', 'prog.id', '=', 'pd.program_id');

        $this->applyStandardFilters($query, $viewer, $filters, 'pd.program_id', 'prog.department_id', 'edu.graduation_year', 'es', 'emp.reported_at');

        $records = $query->select([
            'ap.id as alumni_id',
            'ap.name as alumni_name',
            'prog.code as program_code',
            'prog.name as program_name',
            'edu.graduation_year',
            'emp.job_title',
            'emp.employer_name',
            'emp.industry',
            'emp.employment_type',
            'emp.started_on',
            'emp.is_related_to_degree',
            'es.label as status_label',
        ])->orderByDesc('emp.started_on')->get()->unique('alumni_id')->values();

        $totalFirstJobs = $records->count();
        $relatedCount = $records->filter(fn ($r) => (bool) $r->is_related_to_degree)->count();
        $byIndustry = $records->groupBy(fn ($r) => $r->industry ?: 'Unspecified')
            ->map(fn (Collection $items, string $industry) => [
                'label' => $industry,
                'value' => $items->count(),
            ])->sortByDesc('value')->values();

        $topIndustry = $byIndustry->first()['label'] ?? '—';

        $rows = $records->map(fn ($r) => [
            'alumni_name' => $r->alumni_name,
            'program' => $r->program_code ?? '—',
            'graduation_year' => $r->graduation_year ?? '—',
            'first_job_title' => $r->job_title ?? $r->status_label,
            'first_employer' => $r->employer_name ?? '—',
            'industry' => $r->industry ?? 'Unspecified',
            'employment_type' => $r->employment_type ?? '—',
            'started_on' => $r->started_on ?? '—',
            'degree_related' => $r->is_related_to_degree ? 'Yes' : 'No',
        ])->all();

        return [
            'cards' => [
                ['label' => 'First Jobs Recorded', 'value' => $totalFirstJobs, 'hint' => 'Initial career entry records'],
                ['label' => 'Degree-Related Entry', 'value' => $relatedCount, 'hint' => $this->formatPercent($relatedCount, $totalFirstJobs).' aligned'],
                ['label' => 'Top Entry Industry', 'value' => $topIndustry, 'hint' => 'Most common starting sector'],
                ['label' => 'Industries Represented', 'value' => $byIndustry->count(), 'hint' => 'Distinct career sectors'],
            ],
            'chart' => [
                'title' => 'First Employment by Industry',
                'type' => 'bar',
                'unit' => 'alumni',
                'series' => $byIndustry->take(8)->all(),
            ],
            'columns' => [
                ['key' => 'alumni_name', 'label' => 'Alumnus'],
                ['key' => 'program', 'label' => 'Program'],
                ['key' => 'graduation_year', 'label' => 'Batch', 'align' => 'right'],
                ['key' => 'first_job_title', 'label' => 'First Job Position'],
                ['key' => 'first_employer', 'label' => 'Employer'],
                ['key' => 'industry', 'label' => 'Industry'],
                ['key' => 'employment_type', 'label' => 'Type'],
                ['key' => 'started_on', 'label' => 'Start Date'],
                ['key' => 'degree_related', 'label' => 'Degree-Related'],
            ],
            'rows' => $rows,
        ];
    }

    /**
     * 10. Average Time to First Employment
     */
    private function buildAverageTimeToFirstEmployment(User $viewer, array $filters): array
    {
        $firstEmpIds = DB::table('alumni_employment_records')
            ->whereNotNull('started_on')
            ->selectRaw('MIN(id) as id')
            ->groupBy('alumni_id');

        $query = DB::table('alumni_employment_records as emp')
            ->joinSub($firstEmpIds, 'first_emp', fn ($join) => $join->on('first_emp.id', '=', 'emp.id'))
            ->join('alumni_profiles as ap', 'ap.id', '=', 'emp.alumni_id')
            ->join('employment_statuses as es', 'es.id', '=', 'emp.employment_status_id')
            ->join('alumni_education_records as edu', 'edu.alumni_profile_id', '=', 'ap.id')
            ->join('program_degrees as pd', 'pd.id', '=', 'edu.program_degree_id')
            ->join('academic_programs as prog', 'prog.id', '=', 'pd.program_id')
            ->whereNotNull('edu.graduation_year')
            ->whereNotNull('emp.started_on');

        $this->applyStandardFilters($query, $viewer, $filters, 'pd.program_id', 'prog.department_id', 'edu.graduation_year', 'es', 'emp.started_on');

        $records = $query->select([
            'ap.id as alumni_id',
            'prog.id as program_id',
            'prog.code as program_code',
            'prog.name as program_name',
            'edu.graduation_year',
            'emp.started_on',
        ])->get()->unique('alumni_id');

        $withMonths = $records->map(function ($r) {
            $gradDate = Carbon::create((int) $r->graduation_year, 6, 1)->startOfDay();
            $startDate = Carbon::parse($r->started_on)->startOfDay();
            $months = max(0.0, round($gradDate->diffInDays($startDate, false) / 30.44, 1));
            $r->months_to_job = $months;

            return $r;
        });

        $grouped = $withMonths->groupBy('program_id');
        $rows = $grouped->map(function (Collection $items): array {
            $first = $items->first();
            $count = $items->count();
            $avgMonths = $count > 0 ? round((float) $items->avg('months_to_job'), 1) : 0.0;
            $minMonths = $count > 0 ? round((float) $items->min('months_to_job'), 1) : 0.0;
            $maxMonths = $count > 0 ? round((float) $items->max('months_to_job'), 1) : 0.0;
            $withinSix = $items->filter(fn ($r) => $r->months_to_job <= 6.0)->count();
            $withinSixRate = $count > 0 ? round(($withinSix / $count) * 100, 1) : 0.0;

            return [
                'program_code' => $first->program_code,
                'program_name' => $first->program_name,
                'graduates_sampled' => $count,
                'avg_months' => $avgMonths.' mos',
                'min_months' => $minMonths.' mos',
                'max_months' => $maxMonths.' mos',
                'within_six_months_rate' => $withinSixRate.'%',
                '_raw_avg' => $avgMonths,
            ];
        })->sortBy('_raw_avg')->values();

        $totalSampled = $withMonths->count();
        $overallAvg = $totalSampled > 0 ? round((float) $withMonths->avg('months_to_job'), 1) : 0.0;
        $withinSixAll = $withMonths->filter(fn ($r) => $r->months_to_job <= 6.0)->count();

        return [
            'cards' => [
                ['label' => 'Graduates Sampled', 'value' => $totalSampled, 'hint' => 'With graduation year & start date'],
                ['label' => 'Avg Time to First Job', 'value' => $overallAvg.' mos', 'hint' => 'Months from graduation'],
                ['label' => 'Hired Within 6 Months', 'value' => $this->formatPercent($withinSixAll, $totalSampled), 'hint' => $withinSixAll.' graduates'],
                ['label' => 'Fastest Program Avg', 'value' => isset($rows[0]) ? $rows[0]['avg_months'] : '—', 'hint' => $rows[0]['program_code'] ?? '—'],
            ],
            'chart' => [
                'title' => 'Average Months to First Employment by Program',
                'type' => 'bar',
                'unit' => 'mos',
                'series' => $rows->map(fn (array $r) => [
                    'label' => $r['program_code'],
                    'value' => $r['_raw_avg'],
                ])->all(),
            ],
            'columns' => [
                ['key' => 'program_code', 'label' => 'Program Code'],
                ['key' => 'program_name', 'label' => 'Academic Program'],
                ['key' => 'graduates_sampled', 'label' => 'Sample Size', 'align' => 'right'],
                ['key' => 'avg_months', 'label' => 'Avg Duration', 'align' => 'right'],
                ['key' => 'min_months', 'label' => 'Shortest', 'align' => 'right'],
                ['key' => 'max_months', 'label' => 'Longest', 'align' => 'right'],
                ['key' => 'within_six_months_rate', 'label' => 'Hired ≤ 6 Mos', 'align' => 'right'],
            ],
            'rows' => $rows->map(fn (array $r) => collect($r)->except(['_raw_avg'])->all())->all(),
        ];
    }

    /**
     * 11. Further Studies Statistics
     */
    private function buildFurtherStudiesStatistics(User $viewer, array $filters): array
    {
        $records = $this->baseScopedAlumniQuery($viewer, $filters)
            ->whereNotNull('prog.id')
            ->select([
                'prog.id as program_id',
                'prog.code as program_code',
                'prog.name as program_name',
                'dept.name as department_name',
                'ap.id as alumni_id',
                'deg.degree_level',
                'es.code as status_code',
            ])
            ->get();

        $grouped = $records->groupBy('program_id');

        $rows = $grouped->map(function (Collection $items): array {
            $first = $items->first();
            $totalAlumni = $items->unique('alumni_id')->count();
            $furtherStudiesStatus = $items->filter(fn ($r) => $r->status_code === 'further-studies')->unique('alumni_id')->count();
            $postgradDegrees = $items->filter(fn ($r) => in_array(strtolower((string) $r->degree_level), ['master', 'masters', 'doctoral', 'doctorate', 'postgraduate'], true))->unique('alumni_id')->count();
            $combinedIds = $items->filter(fn ($r) => $r->status_code === 'further-studies' || in_array(strtolower((string) $r->degree_level), ['master', 'masters', 'doctoral', 'doctorate', 'postgraduate'], true))->unique('alumni_id')->count();
            $rate = $totalAlumni > 0 ? round(($combinedIds / $totalAlumni) * 100, 1) : 0.0;

            return [
                'program_code' => $first->program_code,
                'program_name' => $first->program_name,
                'department_name' => $first->department_name ?? '—',
                'total_alumni' => $totalAlumni,
                'further_studies_status' => $furtherStudiesStatus,
                'postgrad_degrees' => $postgradDegrees,
                'advanced_learners' => $combinedIds,
                'participation_rate' => $rate.'%',
                '_raw_count' => $combinedIds,
            ];
        })->sortByDesc('_raw_count')->values();

        $totalFurtherStatus = $records->filter(fn ($r) => $r->status_code === 'further-studies')->unique('alumni_id')->count();
        $totalPostgrad = $records->filter(fn ($r) => in_array(strtolower((string) $r->degree_level), ['master', 'masters', 'doctoral', 'doctorate', 'postgraduate'], true))->unique('alumni_id')->count();
        $totalAdvanced = $records->filter(fn ($r) => $r->status_code === 'further-studies' || in_array(strtolower((string) $r->degree_level), ['master', 'masters', 'doctoral', 'doctorate', 'postgraduate'], true))->unique('alumni_id')->count();

        return [
            'cards' => [
                ['label' => 'Pursuing Further Studies', 'value' => $totalFurtherStatus, 'hint' => 'Reported in employment tracer'],
                ['label' => 'Post-Grad Degrees', 'value' => $totalPostgrad, 'hint' => 'Master’s / Doctoral records'],
                ['label' => 'Total Advanced Learners', 'value' => $totalAdvanced, 'hint' => 'Combined unique alumni'],
                ['label' => 'Programs Represented', 'value' => $rows->filter(fn ($r) => $r['advanced_learners'] > 0)->count(), 'hint' => 'Academic programs with scholars'],
            ],
            'chart' => [
                'title' => 'Further Studies & Post-Graduate Scholars by Program',
                'type' => 'bar',
                'unit' => 'alumni',
                'series' => $rows->map(fn (array $r) => [
                    'label' => $r['program_code'],
                    'value' => $r['advanced_learners'],
                ])->all(),
            ],
            'columns' => [
                ['key' => 'program_code', 'label' => 'Code'],
                ['key' => 'program_name', 'label' => 'Academic Program'],
                ['key' => 'department_name', 'label' => 'Department'],
                ['key' => 'total_alumni', 'label' => 'Total Alumni', 'align' => 'right'],
                ['key' => 'further_studies_status', 'label' => 'Further Studies Status', 'align' => 'right'],
                ['key' => 'postgrad_degrees', 'label' => 'Post-Grad Degrees', 'align' => 'right'],
                ['key' => 'advanced_learners', 'label' => 'Total Scholars', 'align' => 'right'],
                ['key' => 'participation_rate', 'label' => 'Share', 'align' => 'right'],
            ],
            'rows' => $rows->map(fn (array $r) => collect($r)->except(['_raw_count'])->all())->all(),
        ];
    }

    /**
     * 12. Employment History
     */
    private function buildEmploymentHistory(User $viewer, array $filters): array
    {
        $query = DB::table('alumni_employment_records as emp')
            ->join('alumni_profiles as ap', 'ap.id', '=', 'emp.alumni_id')
            ->join('employment_statuses as es', 'es.id', '=', 'emp.employment_status_id')
            ->leftJoin('alumni_education_records as edu', 'edu.alumni_profile_id', '=', 'ap.id')
            ->leftJoin('program_degrees as pd', 'pd.id', '=', 'edu.program_degree_id')
            ->leftJoin('academic_programs as prog', 'prog.id', '=', 'pd.program_id');

        $this->applyStandardFilters($query, $viewer, $filters, 'pd.program_id', 'prog.department_id', 'edu.graduation_year', 'es', 'emp.reported_at');

        $records = $query->select([
            'emp.id as record_id',
            'ap.id as alumni_id',
            'ap.name as alumni_name',
            'edu.student_number',
            'prog.code as program_code',
            'edu.graduation_year',
            'es.label as status_label',
            'emp.job_title',
            'emp.employer_name',
            'emp.industry',
            'emp.work_location',
            'emp.is_related_to_degree',
            'emp.started_on',
            'emp.ended_on',
        ])->orderByDesc('emp.reported_at')->orderByDesc('emp.id')->get()->unique('record_id')->values();

        $totalRecords = $records->count();
        $uniqueAlumni = $records->unique('alumni_id')->count();
        $relatedCount = $records->filter(fn ($r) => (bool) $r->is_related_to_degree)->count();
        $currentRoles = $records->filter(fn ($r) => $r->ended_on === null)->count();

        $byStatus = $records->groupBy('status_label')
            ->map(fn (Collection $items, string $label) => [
                'label' => $label,
                'value' => $items->count(),
            ])->sortByDesc('value')->values()->all();

        $rows = $records->map(fn ($r) => [
            'alumni_name' => $r->alumni_name,
            'program' => $r->program_code ?? '—',
            'graduation_year' => $r->graduation_year ?? '—',
            'status' => $r->status_label,
            'job_title' => $r->job_title ?? '—',
            'employer_name' => $r->employer_name ?? '—',
            'industry' => $r->industry ?? '—',
            'work_location' => $r->work_location ?? '—',
            'degree_related' => $r->is_related_to_degree ? 'Yes' : 'No',
            'period' => ($r->started_on ?? 'N/A').' to '.($r->ended_on ?? 'Present'),
        ])->all();

        return [
            'cards' => [
                ['label' => 'Employment Records', 'value' => $totalRecords, 'hint' => 'Historical & current entries'],
                ['label' => 'Unique Alumni', 'value' => $uniqueAlumni, 'hint' => 'Graduates with career logs'],
                ['label' => 'Degree-Related Entries', 'value' => $relatedCount, 'hint' => $this->formatPercent($relatedCount, $totalRecords).' of entries'],
                ['label' => 'Current / Active Roles', 'value' => $currentRoles, 'hint' => 'No end date recorded'],
            ],
            'chart' => [
                'title' => 'Employment History Entries by Status',
                'type' => 'bar',
                'unit' => 'records',
                'series' => $byStatus,
            ],
            'columns' => [
                ['key' => 'alumni_name', 'label' => 'Alumnus'],
                ['key' => 'program', 'label' => 'Program'],
                ['key' => 'graduation_year', 'label' => 'Batch', 'align' => 'right'],
                ['key' => 'status', 'label' => 'Status'],
                ['key' => 'job_title', 'label' => 'Position'],
                ['key' => 'employer_name', 'label' => 'Employer'],
                ['key' => 'industry', 'label' => 'Industry'],
                ['key' => 'work_location', 'label' => 'Location'],
                ['key' => 'degree_related', 'label' => 'Degree-Related'],
                ['key' => 'period', 'label' => 'Period'],
            ],
            'rows' => $rows,
        ];
    }

    /**
     * 13. Survey Participation Rate
     */
    private function buildSurveyParticipationRate(User $viewer, array $filters): array
    {
        $eligibleAlumniIds = $this->baseScopedAlumniQuery($viewer, $filters)
            ->pluck('ap.id')
            ->unique()
            ->values();

        $eligibleCount = $eligibleAlumniIds->count();

        $surveysQuery = DB::table('surveys')->orderByDesc('created_at');
        if ($filters['date_from'] !== null) {
            $surveysQuery->whereDate('created_at', '>=', $filters['date_from']);
        }
        if ($filters['date_to'] !== null) {
            $surveysQuery->whereDate('created_at', '<=', $filters['date_to']);
        }

        $surveys = $surveysQuery->get();

        $rows = $surveys->map(function ($survey) use ($eligibleAlumniIds, $eligibleCount): array {
            $responsesCount = $eligibleCount > 0
                ? DB::table('survey_responses')
                    ->where('survey_id', $survey->id)
                    ->whereIn('alumni_profile_id', $eligibleAlumniIds)
                    ->count()
                : 0;

            $rate = $eligibleCount > 0 ? round(($responsesCount / $eligibleCount) * 100, 1) : 0.0;

            return [
                'survey_title' => $survey->title,
                'status' => ucfirst($survey->status),
                'published_at' => $survey->published_at ? substr((string) $survey->published_at, 0, 10) : 'Draft',
                'closes_at' => $survey->closes_at ? substr((string) $survey->closes_at, 0, 10) : 'Open',
                'eligible_alumni' => $eligibleCount,
                'responses_count' => $responsesCount,
                'participation_rate' => $rate.'%',
                '_raw_rate' => $rate,
            ];
        })->values();

        $totalSurveys = $rows->count();
        $publishedCount = $surveys->where('status', 'published')->count();
        $totalResponses = $rows->sum('responses_count');
        $avgRate = $totalSurveys > 0 ? round((float) $rows->avg('_raw_rate'), 1) : 0.0;

        return [
            'cards' => [
                ['label' => 'Total Surveys', 'value' => $totalSurveys, 'hint' => $publishedCount.' published'],
                ['label' => 'Eligible Alumni', 'value' => $eligibleCount, 'hint' => 'In current filter scope'],
                ['label' => 'Unique Responses', 'value' => $totalResponses, 'hint' => '1 response per alumnus per survey'],
                ['label' => 'Avg Participation Rate', 'value' => $avgRate.'%', 'hint' => 'Across listed surveys'],
            ],
            'chart' => [
                'title' => 'Survey Participation Rate (%)',
                'type' => 'bar',
                'unit' => '%',
                'series' => $rows->map(fn (array $r) => [
                    'label' => $r['survey_title'],
                    'value' => $r['_raw_rate'],
                    'percentage' => $r['_raw_rate'],
                ])->all(),
            ],
            'columns' => [
                ['key' => 'survey_title', 'label' => 'Survey Title'],
                ['key' => 'status', 'label' => 'Status'],
                ['key' => 'published_at', 'label' => 'Published'],
                ['key' => 'closes_at', 'label' => 'Closes'],
                ['key' => 'eligible_alumni', 'label' => 'Eligible Alumni', 'align' => 'right'],
                ['key' => 'responses_count', 'label' => 'Responses', 'align' => 'right'],
                ['key' => 'participation_rate', 'label' => 'Participation Rate', 'align' => 'right'],
            ],
            'rows' => $rows->map(fn (array $r) => collect($r)->except(['_raw_rate'])->all())->all(),
        ];
    }

    /**
     * 14. Survey Response Summary
     */
    private function buildSurveyResponseSummary(User $viewer, array $filters): array
    {
        $eligibleAlumniIds = $this->baseScopedAlumniQuery($viewer, $filters)
            ->pluck('ap.id')
            ->unique()
            ->values();

        $questions = DB::table('survey_questions as sq')
            ->join('surveys as s', 's.id', '=', 'sq.survey_id')
            ->select([
                'sq.id as question_id',
                'sq.survey_id',
                'sq.prompt',
                'sq.type',
                's.title as survey_title',
            ])
            ->orderBy('s.id')
            ->orderBy('sq.position')
            ->get();

        $responsesQuery = DB::table('survey_responses')
            ->whereIn('alumni_profile_id', $eligibleAlumniIds->isNotEmpty() ? $eligibleAlumniIds : [0]);

        if ($filters['date_from'] !== null) {
            $responsesQuery->whereDate('submitted_at', '>=', $filters['date_from']);
        }
        if ($filters['date_to'] !== null) {
            $responsesQuery->whereDate('submitted_at', '<=', $filters['date_to']);
        }

        $responses = $responsesQuery->get();
        $responsesBySurvey = $responses->groupBy('survey_id');

        $rows = $questions->map(function ($question) use ($responsesBySurvey): array {
            $surveyResponses = $responsesBySurvey->get($question->survey_id, collect());
            $answerValues = [];

            foreach ($surveyResponses as $response) {
                $decoded = json_decode((string) $response->answers, true);
                if (is_array($decoded) && array_key_exists((string) $question->question_id, $decoded)) {
                    $val = $decoded[(string) $question->question_id];
                    $answerValues[] = is_array($val) ? implode(', ', $val) : (string) $val;
                }
            }

            $answeredCount = count($answerValues);
            $topAnswer = 'No responses yet';
            if ($answeredCount > 0) {
                $counts = array_count_values(array_filter($answerValues, fn ($v) => $v !== ''));
                arsort($counts);
                $topKey = array_key_first($counts);
                if ($topKey !== null) {
                    $topAnswer = $topKey.' ('.$counts[$topKey].')';
                }
            }

            return [
                'survey_title' => $question->survey_title,
                'question_prompt' => $question->prompt,
                'question_type' => ucfirst($question->type),
                'responses_count' => $answeredCount,
                'top_answer' => $topAnswer,
            ];
        })->values();

        return [
            'cards' => [
                ['label' => 'Surveys Analyzed', 'value' => $questions->pluck('survey_id')->unique()->count(), 'hint' => 'With configured questions'],
                ['label' => 'Questions Tracked', 'value' => $questions->count(), 'hint' => 'Across all surveys'],
                ['label' => 'Submitted Responses', 'value' => $responses->count(), 'hint' => 'From scoped alumni'],
                ['label' => 'Answered Prompts', 'value' => $rows->sum('responses_count'), 'hint' => 'Total question answers'],
            ],
            'chart' => [
                'title' => 'Responses per Survey Question',
                'type' => 'bar',
                'unit' => 'answers',
                'series' => $rows->take(10)->map(fn (array $r) => [
                    'label' => mb_strimwidth($r['question_prompt'], 0, 28, '…'),
                    'value' => $r['responses_count'],
                ])->all(),
            ],
            'columns' => [
                ['key' => 'survey_title', 'label' => 'Survey'],
                ['key' => 'question_prompt', 'label' => 'Question Prompt'],
                ['key' => 'question_type', 'label' => 'Type'],
                ['key' => 'responses_count', 'label' => 'Responses', 'align' => 'right'],
                ['key' => 'top_answer', 'label' => 'Top / Most Frequent Answer'],
            ],
            'rows' => $rows->all(),
        ];
    }

    /**
     * 15. Job Portal Analytics
     */
    private function buildJobPortalAnalytics(User $viewer, array $filters): array
    {
        $eligibleAlumniIds = $this->baseScopedAlumniQuery($viewer, $filters)
            ->pluck('ap.id')
            ->unique()
            ->values();

        $postingsQuery = DB::table('job_postings as jp')
            ->join('employers as emp', 'emp.id', '=', 'jp.employer_id')
            ->orderByDesc('jp.created_at');

        if ($filters['date_from'] !== null) {
            $postingsQuery->whereDate('jp.created_at', '>=', $filters['date_from']);
        }
        if ($filters['date_to'] !== null) {
            $postingsQuery->whereDate('jp.created_at', '<=', $filters['date_to']);
        }

        $postings = $postingsQuery->select([
            'jp.id',
            'jp.title',
            'jp.location',
            'jp.employment_type',
            'jp.workplace_type',
            'jp.status',
            'jp.published_at',
            'emp.company_name',
            'emp.industry',
            'emp.verification_status',
        ])->get();

        $isScopedFilter = $this->isDepartmentCoordinatorOnly($viewer)
            || $filters['department_id'] !== null
            || $filters['program_id'] !== null
            || $filters['graduation_year'] !== null;

        $applicationsQuery = DB::table('job_applications');
        if ($isScopedFilter) {
            $applicationsQuery->whereIn('alumni_profile_id', $eligibleAlumniIds->isNotEmpty() ? $eligibleAlumniIds : [0]);
        }
        $applicationsByJob = $applicationsQuery->get()->groupBy('job_posting_id');

        $rows = $postings->map(function ($job) use ($applicationsByJob): array {
            $apps = $applicationsByJob->get($job->id, collect());
            $hired = $apps->where('status', 'hired')->count();

            return [
                'job_title' => $job->title,
                'company_name' => $job->company_name,
                'industry' => $job->industry ?? '—',
                'workplace_type' => ucfirst($job->workplace_type ?? 'onsite'),
                'employment_type' => ucfirst($job->employment_type ?? 'full-time'),
                'status' => ucfirst($job->status),
                'applications_count' => $apps->count(),
                'hired_count' => $hired,
            ];
        })->values();

        $verifiedEmployers = DB::table('employers')->where('verification_status', 'verified')->count();
        $publishedJobs = $postings->where('status', 'published')->count();
        $totalApps = $rows->sum('applications_count');

        $byStatus = $postings->groupBy('status')->map(fn (Collection $items, string $status) => [
            'label' => ucfirst($status),
            'value' => $items->count(),
        ])->values()->all();

        return [
            'cards' => [
                ['label' => 'Total Job Postings', 'value' => $postings->count(), 'hint' => $publishedJobs.' published roles'],
                ['label' => 'Verified Employers', 'value' => $verifiedEmployers, 'hint' => 'Approved corporate partners'],
                ['label' => 'Total Applications', 'value' => $totalApps, 'hint' => 'Submitted through portal'],
                ['label' => 'Successful Hires', 'value' => $rows->sum('hired_count'), 'hint' => 'Marked as hired'],
            ],
            'chart' => [
                'title' => 'Job Postings by Publication Status',
                'type' => 'bar',
                'unit' => 'jobs',
                'series' => $byStatus,
            ],
            'columns' => [
                ['key' => 'job_title', 'label' => 'Job Title'],
                ['key' => 'company_name', 'label' => 'Employer'],
                ['key' => 'industry', 'label' => 'Industry'],
                ['key' => 'workplace_type', 'label' => 'Workplace'],
                ['key' => 'employment_type', 'label' => 'Type'],
                ['key' => 'status', 'label' => 'Status'],
                ['key' => 'applications_count', 'label' => 'Applications', 'align' => 'right'],
                ['key' => 'hired_count', 'label' => 'Hired', 'align' => 'right'],
            ],
            'rows' => $rows->all(),
        ];
    }

    /**
     * 16. Job Application Statistics
     */
    private function buildJobApplicationStatistics(User $viewer, array $filters): array
    {
        $eligibleAlumniIds = $this->baseScopedAlumniQuery($viewer, $filters)
            ->pluck('ap.id')
            ->unique()
            ->values();

        $query = DB::table('job_applications as ja')
            ->join('job_postings as jp', 'jp.id', '=', 'ja.job_posting_id')
            ->whereIn('ja.alumni_profile_id', $eligibleAlumniIds->isNotEmpty() ? $eligibleAlumniIds : [0]);

        if ($filters['date_from'] !== null) {
            $query->whereDate('ja.created_at', '>=', $filters['date_from']);
        }
        if ($filters['date_to'] !== null) {
            $query->whereDate('ja.created_at', '<=', $filters['date_to']);
        }

        $apps = $query->select([
            'ja.id',
            'ja.status',
            'ja.alumni_profile_id',
            'ja.job_posting_id',
        ])->get();

        $totalApps = $apps->count();
        $uniqueApplicants = $apps->pluck('alumni_profile_id')->unique()->count();
        $shortlistedCount = $apps->whereIn('status', ['shortlisted', 'interviewed', 'offered'])->count();
        $hiredCount = $apps->where('status', 'hired')->count();

        $grouped = $apps->groupBy('status');
        $rows = $grouped->map(function (Collection $items, string $status) use ($totalApps): array {
            $count = $items->count();
            $pct = $totalApps > 0 ? round(($count / $totalApps) * 100, 1) : 0.0;

            return [
                'status' => ucfirst($status),
                'applications_count' => $count,
                'unique_applicants' => $items->pluck('alumni_profile_id')->unique()->count(),
                'unique_jobs' => $items->pluck('job_posting_id')->unique()->count(),
                'share_percentage' => $pct.'%',
                '_raw_pct' => $pct,
            ];
        })->sortByDesc('applications_count')->values();

        return [
            'cards' => [
                ['label' => 'Total Applications', 'value' => $totalApps, 'hint' => 'Submitted by scoped alumni'],
                ['label' => 'Unique Applicants', 'value' => $uniqueApplicants, 'hint' => 'Distinct alumni applying'],
                ['label' => 'In Review / Shortlisted', 'value' => $shortlistedCount, 'hint' => 'Active candidate pipeline'],
                ['label' => 'Hired / Placed', 'value' => $hiredCount, 'hint' => $this->formatPercent($hiredCount, $totalApps).' conversion'],
            ],
            'chart' => [
                'title' => 'Job Applications by Pipeline Stage',
                'type' => 'bar',
                'unit' => 'applications',
                'series' => $rows->map(fn (array $r) => [
                    'label' => $r['status'],
                    'value' => $r['applications_count'],
                    'percentage' => $r['_raw_pct'],
                ])->all(),
            ],
            'columns' => [
                ['key' => 'status', 'label' => 'Application Status'],
                ['key' => 'applications_count', 'label' => 'Applications', 'align' => 'right'],
                ['key' => 'unique_applicants', 'label' => 'Unique Applicants', 'align' => 'right'],
                ['key' => 'unique_jobs', 'label' => 'Job Postings', 'align' => 'right'],
                ['key' => 'share_percentage', 'label' => 'Pipeline Share', 'align' => 'right'],
            ],
            'rows' => $rows->map(fn (array $r) => collect($r)->except(['_raw_pct'])->all())->all(),
        ];
    }

    /**
     * 17. Successful Job Placements
     */
    private function buildSuccessfulJobPlacements(User $viewer, array $filters): array
    {
        $eligibleAlumniIds = $this->baseScopedAlumniQuery($viewer, $filters)
            ->pluck('ap.id')
            ->unique()
            ->values();

        $query = DB::table('job_applications as ja')
            ->join('job_postings as jp', 'jp.id', '=', 'ja.job_posting_id')
            ->join('employers as emp', 'emp.id', '=', 'jp.employer_id')
            ->join('alumni_profiles as ap', 'ap.id', '=', 'ja.alumni_profile_id')
            ->leftJoin('alumni_education_records as edu', 'edu.alumni_profile_id', '=', 'ap.id')
            ->leftJoin('program_degrees as pd', 'pd.id', '=', 'edu.program_degree_id')
            ->leftJoin('academic_programs as prog', 'prog.id', '=', 'pd.program_id')
            ->where('ja.status', 'hired')
            ->whereIn('ja.alumni_profile_id', $eligibleAlumniIds->isNotEmpty() ? $eligibleAlumniIds : [0]);

        if ($filters['date_from'] !== null) {
            $query->whereDate('ja.created_at', '>=', $filters['date_from']);
        }
        if ($filters['date_to'] !== null) {
            $query->whereDate('ja.created_at', '<=', $filters['date_to']);
        }

        $placements = $query->select([
            'ja.id as application_id',
            'ap.name as alumni_name',
            'edu.student_number',
            'prog.code as program_code',
            'prog.name as program_name',
            'edu.graduation_year',
            'jp.title as job_title',
            'emp.company_name',
            'emp.industry',
            'ja.reviewed_at',
            'ja.created_at',
        ])->orderByDesc('ja.reviewed_at')->get()->unique('application_id')->values();

        $totalAppsCount = DB::table('job_applications')
            ->whereIn('alumni_profile_id', $eligibleAlumniIds->isNotEmpty() ? $eligibleAlumniIds : [0])
            ->count();

        $byProgram = $placements->groupBy(fn ($r) => $r->program_code ?: 'Unassigned')
            ->map(fn (Collection $items, string $code) => [
                'label' => $code,
                'value' => $items->count(),
            ])->sortByDesc('value')->values()->all();

        $rows = $placements->map(fn ($r) => [
            'alumni_name' => $r->alumni_name,
            'student_number' => $r->student_number ?? '—',
            'program' => $r->program_code ?? '—',
            'graduation_year' => $r->graduation_year ?? '—',
            'job_title' => $r->job_title,
            'company_name' => $r->company_name,
            'industry' => $r->industry ?? '—',
            'placed_at' => substr((string) ($r->reviewed_at ?? $r->created_at), 0, 10),
        ])->all();

        return [
            'cards' => [
                ['label' => 'Successful Placements', 'value' => $placements->count(), 'hint' => 'Verified portal hires'],
                ['label' => 'Hiring Employers', 'value' => $placements->pluck('company_name')->unique()->count(), 'hint' => 'Partner companies'],
                ['label' => 'Programs Placed', 'value' => $placements->pluck('program_code')->filter()->unique()->count(), 'hint' => 'Academic programs with hires'],
                ['label' => 'Placement Conversion', 'value' => $this->formatPercent($placements->count(), $totalAppsCount), 'hint' => 'Of total portal applications'],
            ],
            'chart' => [
                'title' => 'Successful Job Placements by Academic Program',
                'type' => 'bar',
                'unit' => 'placements',
                'series' => $byProgram,
            ],
            'columns' => [
                ['key' => 'alumni_name', 'label' => 'Alumnus Name'],
                ['key' => 'student_number', 'label' => 'Student No.'],
                ['key' => 'program', 'label' => 'Program'],
                ['key' => 'graduation_year', 'label' => 'Batch', 'align' => 'right'],
                ['key' => 'job_title', 'label' => 'Placed Position'],
                ['key' => 'company_name', 'label' => 'Employer'],
                ['key' => 'industry', 'label' => 'Industry'],
                ['key' => 'placed_at', 'label' => 'Placement Date'],
            ],
            'rows' => $rows,
        ];
    }

    /**
     * 18. Graduate Tracer Summary
     */
    private function buildGraduateTracerSummary(User $viewer, array $filters): array
    {
        $records = $this->baseScopedAlumniQuery($viewer, $filters)
            ->whereNotNull('prog.id')
            ->select([
                'prog.id as program_id',
                'prog.code as program_code',
                'prog.name as program_name',
                'dept.name as department_name',
                'ap.id as alumni_id',
                'u.id as user_id',
                'emp.id as emp_id',
                'es.code as status_code',
                'es.label as status_label',
                'emp.is_related_to_degree',
            ])
            ->get();

        $surveyRespondentIds = DB::table('survey_responses')
            ->pluck('alumni_profile_id')
            ->unique()
            ->flip();

        $placedAlumniIds = DB::table('job_applications')
            ->where('status', 'hired')
            ->pluck('alumni_profile_id')
            ->unique()
            ->flip();

        $grouped = $records->groupBy('program_id');

        $rows = $grouped->map(function (Collection $items) use ($surveyRespondentIds, $placedAlumniIds): array {
            $first = $items->first();
            $unique = $items->unique('alumni_id');
            $totalAlumni = $unique->count();
            $claimed = $unique->filter(fn ($r) => $r->user_id !== null)->count();
            $tracked = $unique->filter(fn ($r) => $r->emp_id !== null)->count();
            $employed = $unique->filter(fn ($r) => $this->isEmployedCode($r->status_code, $r->status_label))->count();
            $related = $unique->filter(fn ($r) => $this->isEmployedCode($r->status_code, $r->status_label) && (bool) $r->is_related_to_degree)->count();
            $empRate = $tracked > 0 ? round(($employed / $tracked) * 100, 1) : 0.0;
            $alignRate = $employed > 0 ? round(($related / $employed) * 100, 1) : 0.0;
            $surveyed = $unique->filter(fn ($r) => $surveyRespondentIds->has($r->alumni_id))->count();
            $placed = $unique->filter(fn ($r) => $placedAlumniIds->has($r->alumni_id))->count();

            return [
                'program_code' => $first->program_code,
                'program_name' => $first->program_name,
                'department_name' => $first->department_name ?? '—',
                'total_alumni' => $totalAlumni,
                'claimed_accounts' => $claimed,
                'tracked_employment' => $tracked,
                'employed_count' => $employed,
                'employment_rate' => $empRate.'%',
                'degree_related_rate' => $alignRate.'%',
                'survey_respondents' => $surveyed,
                'job_placements' => $placed,
                '_raw_emp_rate' => $empRate,
            ];
        })->sortByDesc('total_alumni')->values();

        $uniqueAll = $records->unique('alumni_id');
        $totalAlumniAll = $uniqueAll->count();
        $trackedAll = $uniqueAll->filter(fn ($r) => $r->emp_id !== null)->count();
        $employedAll = $uniqueAll->filter(fn ($r) => $this->isEmployedCode($r->status_code, $r->status_label))->count();
        $relatedAll = $uniqueAll->filter(fn ($r) => $this->isEmployedCode($r->status_code, $r->status_label) && (bool) $r->is_related_to_degree)->count();
        $surveyedAll = $uniqueAll->filter(fn ($r) => $surveyRespondentIds->has($r->alumni_id))->count();

        return [
            'cards' => [
                ['label' => 'Total Alumni', 'value' => $totalAlumniAll, 'hint' => $trackedAll.' tracked in employment'],
                ['label' => 'Employment Rate', 'value' => $this->formatPercent($employedAll, $trackedAll), 'hint' => $employedAll.' employed graduates'],
                ['label' => 'Degree Alignment', 'value' => $this->formatPercent($relatedAll, $employedAll), 'hint' => $relatedAll.' in degree-related roles'],
                ['label' => 'Survey Respondents', 'value' => $surveyedAll, 'hint' => 'Unique alumni surveyed'],
            ],
            'chart' => [
                'title' => 'Executive Tracer Summary: Employment Rate (%) by Program',
                'type' => 'bar',
                'unit' => '%',
                'series' => $rows->map(fn (array $r) => [
                    'label' => $r['program_code'],
                    'value' => $r['_raw_emp_rate'],
                    'percentage' => $r['_raw_emp_rate'],
                ])->all(),
            ],
            'columns' => [
                ['key' => 'program_code', 'label' => 'Code'],
                ['key' => 'program_name', 'label' => 'Academic Program'],
                ['key' => 'department_name', 'label' => 'Department'],
                ['key' => 'total_alumni', 'label' => 'Alumni', 'align' => 'right'],
                ['key' => 'claimed_accounts', 'label' => 'Claimed', 'align' => 'right'],
                ['key' => 'employed_count', 'label' => 'Employed', 'align' => 'right'],
                ['key' => 'employment_rate', 'label' => 'Emp. Rate', 'align' => 'right'],
                ['key' => 'degree_related_rate', 'label' => 'Degree Aligned', 'align' => 'right'],
                ['key' => 'survey_respondents', 'label' => 'Surveyed', 'align' => 'right'],
                ['key' => 'job_placements', 'label' => 'Placed', 'align' => 'right'],
            ],
            'rows' => $rows->map(fn (array $r) => collect($r)->except(['tracked_employment', '_raw_emp_rate'])->all())->all(),
        ];
    }

    /**
     * Export report payload as an Excel-compatible SpreadsheetML (.xls) document.
     *
     * @param  array<string, mixed>  $report
     */
    public function exportExcelXml(array $report): string
    {
        $esc = fn (mixed $val): string => htmlspecialchars($this->sanitizeExportCell((string) ($val ?? '')), ENT_QUOTES | ENT_XML1, 'UTF-8');

        $title = $esc($report['title'] ?? 'Institutional Report');
        $subtitle = $esc($report['description'] ?? '');
        $generatedAt = $esc($report['generated_at'] ?? now()->toIso8601String());

        $xml = '<?xml version="1.0" encoding="UTF-8"?>'."\n";
        $xml .= '<?mso-application progid="Excel.Sheet"?>'."\n";
        $xml .= '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">'."\n";
        $xml .= '  <Styles>'."\n";
        $xml .= '    <Style ss:ID="Title"><Font ss:Bold="1" ss:Size="14" ss:Color="#284C36"/></Style>'."\n";
        $xml .= '    <Style ss:ID="Subtitle"><Font ss:Size="10" ss:Color="#58665A"/></Style>'."\n";
        $xml .= '    <Style ss:ID="Header"><Font ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#2B5139" ss:Pattern="Solid"/></Style>'."\n";
        $xml .= '    <Style ss:ID="CardLabel"><Font ss:Bold="1" ss:Color="#33583B"/><Interior ss:Color="#EDF2EB" ss:Pattern="Solid"/></Style>'."\n";
        $xml .= '    <Style ss:ID="Cell"><Font ss:Size="10"/></Style>'."\n";
        $xml .= '  </Styles>'."\n";
        $xml .= '  <Worksheet ss:Name="Institutional Report">'."\n";
        $xml .= '    <Table>'."\n";

        $xml .= '      <Row><Cell ss:StyleID="Title"><Data ss:Type="String">Northfield College - '.$title.'</Data></Cell></Row>'."\n";
        $xml .= '      <Row><Cell ss:StyleID="Subtitle"><Data ss:Type="String">'.$subtitle.' (Generated: '.$generatedAt.')</Data></Cell></Row>'."\n";
        $xml .= '      <Row></Row>'."\n";

        if (! empty($report['cards'])) {
            $xml .= '      <Row>';
            foreach ($report['cards'] as $card) {
                $xml .= '<Cell ss:StyleID="CardLabel"><Data ss:Type="String">'.$esc($card['label']).': '.$esc($card['value']).'</Data></Cell>';
            }
            $xml .= '</Row>'."\n";
            $xml .= '      <Row></Row>'."\n";
        }

        $columns = $report['columns'] ?? [];
        if (! empty($columns)) {
            $xml .= '      <Row>';
            foreach ($columns as $col) {
                $xml .= '<Cell ss:StyleID="Header"><Data ss:Type="String">'.$esc($col['label']).'</Data></Cell>';
            }
            $xml .= '</Row>'."\n";
        }

        foreach ($report['rows'] ?? [] as $row) {
            $xml .= '      <Row>';
            foreach ($columns as $col) {
                $key = $col['key'];
                $val = $row[$key] ?? '';
                $type = is_int($val) || is_float($val) ? 'Number' : 'String';
                $xml .= '<Cell ss:StyleID="Cell"><Data ss:Type="'.$type.'">'.$esc($val).'</Data></Cell>';
            }
            $xml .= '</Row>'."\n";
        }

        $xml .= '    </Table>'."\n";
        $xml .= '  </Worksheet>'."\n";
        $xml .= '</Workbook>';

        return $xml;
    }

    /**
     * Export report payload as a valid native %PDF-1.4 binary document.
     *
     * @param  array<string, mixed>  $report
     */
    public function exportPdfDocument(array $report): string
    {
        $title = 'Northfield College - '.($report['title'] ?? 'Institutional Report');
        $subtitle = (string) ($report['description'] ?? '');
        $generated = 'Generated: '.substr((string) ($report['generated_at'] ?? now()->toDateTimeString()), 0, 19);

        $cardsLine = collect($report['cards'] ?? [])
            ->map(fn (array $c) => $c['label'].': '.$c['value'])
            ->implode('   |   ');

        $columns = $report['columns'] ?? [];
        $rows = $report['rows'] ?? [];

        $lines = [];
        $lines[] = ['type' => 'title', 'text' => $title];
        $lines[] = ['type' => 'subtitle', 'text' => $subtitle];
        $lines[] = ['type' => 'meta', 'text' => $generated];
        $lines[] = ['type' => 'spacer', 'text' => ''];

        if ($cardsLine !== '') {
            $lines[] = ['type' => 'cards', 'text' => $cardsLine];
            $lines[] = ['type' => 'spacer', 'text' => ''];
        }

        $colCount = max(1, count($columns));
        $colWidthChars = max(10, (int) floor(105 / $colCount));

        if (! empty($columns)) {
            $headerParts = [];
            foreach ($columns as $col) {
                $headerParts[] = str_pad(mb_strimwidth((string) $col['label'], 0, $colWidthChars - 1, ''), $colWidthChars);
            }
            $lines[] = ['type' => 'header', 'text' => implode(' ', $headerParts)];
            $lines[] = ['type' => 'rule', 'text' => str_repeat('-', min(115, $colCount * ($colWidthChars + 1)))];
        }

        if (empty($rows)) {
            $lines[] = ['type' => 'row', 'text' => 'No records found matching the selected report filters.'];
        } else {
            foreach ($rows as $row) {
                $rowParts = [];
                foreach ($columns as $col) {
                    $val = (string) ($row[$col['key']] ?? '');
                    $rowParts[] = str_pad(mb_strimwidth($val, 0, $colWidthChars - 1, ''), $colWidthChars);
                }
                $lines[] = ['type' => 'row', 'text' => implode(' ', $rowParts)];
            }
        }

        $chunks = array_chunk($lines, 42);
        if (empty($chunks)) {
            $chunks = [[['type' => 'title', 'text' => $title]]];
        }

        $escapePdf = function (string $text): string {
            $ascii = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $text);
            $clean = $ascii !== false ? $ascii : preg_replace('/[^\x20-\x7E]/', '', $text);

            return str_replace(['\\', '(', ')'], ['\\\\', '\\(', '\\)'], (string) $clean);
        };

        $objects = [];
        $objects[1] = '<< /Type /Catalog /Pages 2 0 R >>';
        $objects[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>';
        $objects[4] = '<< /Type /Font /Subtype /Type1 /BaseFont /Courier-Bold >>';

        $pageObjectIds = [];
        $nextObjId = 5;

        foreach ($chunks as $pageIndex => $pageLines) {
            $pageObjId = $nextObjId++;
            $contentObjId = $nextObjId++;
            $pageObjectIds[] = $pageObjId;

            $streamLines = ["BT", "/F2 12 Tf", "36 555 Td"];
            $firstLine = true;

            foreach ($pageLines as $line) {
                if (! $firstLine) {
                    $streamLines[] = "0 -12 Td";
                }
                $firstLine = false;

                if ($line['type'] === 'title') {
                    $streamLines[] = "/F2 12 Tf";
                } elseif (in_array($line['type'], ['header', 'cards'], true)) {
                    $streamLines[] = "/F2 8 Tf";
                } else {
                    $streamLines[] = "/F1 8 Tf";
                }

                $streamLines[] = '('.$escapePdf($line['text']).') Tj';
            }

            $streamLines[] = "0 -18 Td";
            $streamLines[] = "/F1 7 Tf";
            $streamLines[] = '(Page '.($pageIndex + 1).' of '.count($chunks).' - Alumni Tracer Management System) Tj';
            $streamLines[] = "ET";

            $streamData = implode("\n", $streamLines);
            $objects[$contentObjId] = "<< /Length ".strlen($streamData)." >>\nstream\n".$streamData."\nendstream";
            $objects[$pageObjId] = "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 792 612] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents {$contentObjId} 0 R >>";
        }

        $kids = implode(' ', array_map(fn (int $id) => "{$id} 0 R", $pageObjectIds));
        $objects[2] = "<< /Type /Pages /Kids [ {$kids} ] /Count ".count($pageObjectIds)." >>";
        ksort($objects);

        $pdf = "%PDF-1.4\n";
        $offsets = [0 => 0];

        foreach ($objects as $id => $body) {
            $offsets[$id] = strlen($pdf);
            $pdf .= "{$id} 0 obj\n{$body}\nendobj\n";
        }

        $xrefOffset = strlen($pdf);
        $totalObjects = count($objects) + 1;
        $pdf .= "xref\n0 {$totalObjects}\n";
        $pdf .= "0000000000 65535 f \n";

        for ($i = 1; $i < $totalObjects; $i++) {
            $pdf .= sprintf("%010d 00000 n \n", $offsets[$i] ?? 0);
        }

        $pdf .= "trailer\n<< /Size {$totalObjects} /Root 1 0 R >>\nstartxref\n{$xrefOffset}\n%%EOF";

        return $pdf;
    }

    private function applyStandardFilters(
        Builder $query,
        User $viewer,
        array $filters,
        string $programCol,
        string $deptCol,
        string $yearCol,
        string $statusAlias,
        string $dateCol
    ): void {
        if ($this->isDepartmentCoordinatorOnly($viewer)) {
            $query->whereIn($programCol, $this->assignedProgramIdsQuery($viewer));
        }

        if ($filters['department_id'] !== null) {
            $query->where($deptCol, $filters['department_id']);
        }

        if ($filters['program_id'] !== null) {
            $query->where($programCol, $filters['program_id']);
        }

        if ($filters['graduation_year'] !== null) {
            $query->where($yearCol, $filters['graduation_year']);
        }

        if ($filters['employment_status'] !== null) {
            $query->where(function ($sub) use ($statusAlias, $filters): void {
                $sub->where("{$statusAlias}.code", $filters['employment_status'])
                    ->orWhere("{$statusAlias}.label", $filters['employment_status']);
            });
        }

        if ($filters['date_from'] !== null) {
            $query->whereDate($dateCol, '>=', $filters['date_from']);
        }

        if ($filters['date_to'] !== null) {
            $query->whereDate($dateCol, '<=', $filters['date_to']);
        }
    }

    private function isDepartmentCoordinatorOnly(User $viewer): bool
    {
        return $viewer->hasRole('department-coordinator')
            && ! $viewer->hasRole('system-administrator', 'alumni-coordinator');
    }

    private function assignedProgramIdsQuery(User $viewer): Builder
    {
        return DB::table('user_program_assignments')
            ->where('user_id', $viewer->id)
            ->select('program_id');
    }

    private function isEmployedCode(?string $code, ?string $label = null): bool
    {
        if ($code !== null && in_array(strtolower($code), self::EMPLOYED_STATUS_CODES, true)) {
            return true;
        }

        if ($label !== null) {
            $normalized = strtolower($label);

            return in_array($normalized, ['employed', 'self-employed', 'government employee', 'freelance'], true);
        }

        return false;
    }

    private function formatPercent(int|float $numerator, int|float $denominator): string
    {
        if ($denominator <= 0) {
            return '0%';
        }

        return round(($numerator / $denominator) * 100, 1).'%';
    }

    private function sanitizeExportCell(string $value): string
    {
        if ($value !== '' && preg_match('/^[=+\-@]/', $value) === 1) {
            return "'".$value;
        }

        return $value;
    }
}
