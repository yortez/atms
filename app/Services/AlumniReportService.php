<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use stdClass;

class AlumniReportService
{
    /**
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

        if ($viewer->hasRole('department-coordinator')) {
            $assignedProgramIds = DB::table('user_program_assignments')
                ->where('user_id', $viewer->id)
                ->select('program_id');
            $query->whereIn('program_degrees.program_id', $assignedProgramIds);
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

        if ($viewer->hasRole('department-coordinator')) {
            $assignedProgramIds = DB::table('user_program_assignments')
                ->where('user_id', $viewer->id)
                ->select('program_id');
            $query->whereIn('program_degrees.program_id', $assignedProgramIds);
        }

        return $query->orderBy('graduation_year')->get();
    }
}
