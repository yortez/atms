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
            'education_records' => $this->whenLoaded('educationRecords', fn () => $this->educationRecords->map(fn ($record) => [
                'id' => $record->id,
                'student_number' => $record->student_number,
                'graduation_year' => $record->graduation_year,
                'honors' => $record->honors,
                'program' => $record->programDegree?->program?->name,
                'degree' => $record->programDegree?->degree?->title,
            ])),
            'employment_records' => $this->whenLoaded('employmentRecords', fn () => $this->employmentRecords->map(fn ($record) => [
                'id' => $record->id,
                'status' => $record->status?->label,
                'employer_name' => $record->employer_name,
                'job_title' => $record->job_title,
                'industry' => $record->industry,
                'employment_type' => $record->employment_type,
                'work_location' => $record->work_location,
                'started_on' => $record->started_on?->toDateString(),
                'ended_on' => $record->ended_on?->toDateString(),
                'reported_at' => $record->reported_at->toISOString(),
            ])),
        ];
    }
}
