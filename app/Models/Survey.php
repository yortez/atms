<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * @property int $id
 * @property string $title
 * @property string|null $description
 * @property string $status
 * @property Carbon|null $published_at
 * @property Carbon|null $starts_at
 * @property Carbon|null $closes_at
 * @property bool $is_anonymous
 * @property array<int, int>|null $target_department_ids
 * @property array<int, int>|null $target_program_ids
 * @property array<int, int>|null $target_graduation_years
 */
#[Fillable([
    'title',
    'description',
    'status',
    'published_at',
    'starts_at',
    'closes_at',
    'is_anonymous',
    'target_department_ids',
    'target_program_ids',
    'target_graduation_years',
    'created_by_user_id',
])]
class Survey extends Model
{
    /**
     * @return HasMany<SurveyQuestion, $this>
     */
    public function questions(): HasMany
    {
        return $this->hasMany(SurveyQuestion::class)->orderBy('position');
    }

    /**
     * @return HasMany<SurveyResponse, $this>
     */
    public function responses(): HasMany
    {
        return $this->hasMany(SurveyResponse::class);
    }

    public function hasCohortTargeting(): bool
    {
        return ! empty($this->target_department_ids)
            || ! empty($this->target_program_ids)
            || ! empty($this->target_graduation_years);
    }

    /**
     * Determine whether an alumnus matches this survey's cohort targeting rules.
     * Supports multi-degree alumni (matches if any degree record satisfies the target cohort).
     */
    public function matchesAlumniProfile(int $alumniProfileId): bool
    {
        $targetDepts = array_values(array_filter(array_map('intval', $this->target_department_ids ?? [])));
        $targetProgs = array_values(array_filter(array_map('intval', $this->target_program_ids ?? [])));
        $targetYears = array_values(array_filter(array_map('intval', $this->target_graduation_years ?? [])));

        if ($targetDepts === [] && $targetProgs === [] && $targetYears === []) {
            return true;
        }

        $educationRecords = DB::table('alumni_education_records as edu')
            ->leftJoin('program_degrees as pd', 'pd.id', '=', 'edu.program_degree_id')
            ->leftJoin('academic_programs as prog', 'prog.id', '=', 'pd.program_id')
            ->where('edu.alumni_profile_id', $alumniProfileId)
            ->get([
                'edu.graduation_year',
                'pd.program_id',
                'prog.department_id',
            ]);

        if ($educationRecords->isEmpty()) {
            return false;
        }

        foreach ($educationRecords as $record) {
            $deptMatch = $targetDepts === []
                || ($record->department_id !== null && in_array((int) $record->department_id, $targetDepts, true));
            $progMatch = $targetProgs === []
                || ($record->program_id !== null && in_array((int) $record->program_id, $targetProgs, true));
            $yearMatch = $targetYears === []
                || ($record->graduation_year !== null && in_array((int) $record->graduation_year, $targetYears, true));

            if ($deptMatch && $progMatch && $yearMatch) {
                return true;
            }
        }

        return false;
    }

    protected function casts(): array
    {
        return [
            'published_at' => 'datetime',
            'starts_at' => 'datetime',
            'closes_at' => 'datetime',
            'is_anonymous' => 'boolean',
            'target_department_ids' => 'array',
            'target_program_ids' => 'array',
            'target_graduation_years' => 'array',
        ];
    }
}
