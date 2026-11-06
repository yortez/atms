<?php

namespace App\Http\Resources;

use App\Models\AlumniProfile;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin AlumniProfile
 */
class AlumniProfileResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'preferred_name' => $this->preferred_name,
            'first_name' => $this->first_name,
            'middle_name' => $this->middle_name,
            'last_name' => $this->last_name,
            'suffix' => $this->suffix,
            'email' => $this->email,
            'date_of_birth' => $this->date_of_birth->toDateString(),
            'profile_status' => $this->profile_status,
            'is_claimed' => $this->when($this->resource->relationLoaded('user'), fn () => $this->user !== null),
            'claimed_at' => $this->when($this->resource->relationLoaded('user'), fn () => $this->user?->created_at?->toISOString()),
            'education_records' => $this->whenLoaded('educationRecords', function () use ($request) {
                $records = $this->educationRecords;
                if ($request->user()?->hasRole('department-coordinator') && ! $request->user()?->hasRole('system-administrator', 'alumni-coordinator')) {
                    $assignedIds = $request->user()->assignedPrograms()->pluck('academic_programs.id')->all();
                    $records = $records->filter(fn ($record) => in_array($record->programDegree?->program_id, $assignedIds, true));
                }

                return $records->map(fn ($record) => [
                    'id' => $record->id,
                    'student_number' => $record->student_number,
                    'graduation_year' => $record->graduation_year,
                    'honors' => $record->honors,
                    'gwa' => $record->gwa,
                    'program' => $record->programDegree?->program?->name,
                    'degree' => $record->programDegree?->degree?->title,
                ]);
            }),
            'employment_records' => $this->whenLoaded('employmentRecords', fn () => $this->employmentRecords->map(fn ($record) => [
                'id' => $record->id,
                'status' => $record->status?->label,
                'employer_name' => $record->employer_name,
                'job_title' => $record->job_title,
                'industry' => $record->industry,
                'employment_type' => $record->employment_type,
                'work_location' => $record->work_location,
                'is_related_to_degree' => (bool) $record->is_related_to_degree,
                'started_on' => $record->started_on?->toDateString(),
                'ended_on' => $record->ended_on?->toDateString(),
                'reported_at' => $record->reported_at->toISOString(),
            ])),
        ];
    }
}
