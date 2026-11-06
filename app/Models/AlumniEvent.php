<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * @property int $id
 * @property string $title
 * @property string $description
 * @property string $event_type
 * @property string $format
 * @property string|null $venue
 * @property string|null $meeting_url
 * @property Carbon $starts_at
 * @property Carbon|null $ends_at
 * @property Carbon|null $registration_deadline
 * @property int|null $capacity
 * @property bool $is_featured
 * @property bool $is_public
 * @property array<int, string>|null $audience_roles
 * @property array<int, int>|null $target_department_ids
 * @property array<int, int>|null $target_program_ids
 * @property array<int, int>|null $target_graduation_years
 * @property string $status
 * @property Carbon|null $published_at
 * @property int $created_by_user_id
 */
#[Fillable([
    'title',
    'description',
    'event_type',
    'format',
    'venue',
    'meeting_url',
    'starts_at',
    'ends_at',
    'registration_deadline',
    'capacity',
    'is_featured',
    'is_public',
    'audience_roles',
    'target_department_ids',
    'target_program_ids',
    'target_graduation_years',
    'status',
    'published_at',
    'created_by_user_id',
])]
class AlumniEvent extends Model
{
    public const EVENT_TYPES = [
        'homecoming',
        'career_fair',
        'networking',
        'webinar',
        'workshop',
        'reunion',
    ];

    public const FORMATS = [
        'in_person',
        'online',
        'hybrid',
    ];

    /**
     * @return BelongsTo<User, $this>
     */
    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    /**
     * @return HasMany<AlumniEventRegistration, $this>
     */
    public function registrations(): HasMany
    {
        return $this->hasMany(AlumniEventRegistration::class, 'alumni_event_id');
    }

    public function hasCohortTargeting(): bool
    {
        return ! empty($this->target_department_ids)
            || ! empty($this->target_program_ids)
            || ! empty($this->target_graduation_years);
    }

    public function matchesAlumniProfile(?int $alumniProfileId): bool
    {
        $targetDepts = array_values(array_filter(array_map('intval', $this->target_department_ids ?? [])));
        $targetProgs = array_values(array_filter(array_map('intval', $this->target_program_ids ?? [])));
        $targetYears = array_values(array_filter(array_map('intval', $this->target_graduation_years ?? [])));

        if ($targetDepts === [] && $targetProgs === [] && $targetYears === []) {
            return true;
        }

        if ($alumniProfileId === null) {
            return false;
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
            'audience_roles' => 'array',
            'target_department_ids' => 'array',
            'target_program_ids' => 'array',
            'target_graduation_years' => 'array',
            'capacity' => 'integer',
            'is_featured' => 'boolean',
            'is_public' => 'boolean',
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
            'registration_deadline' => 'datetime',
            'published_at' => 'datetime',
        ];
    }
}

