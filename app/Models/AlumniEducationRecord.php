<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

#[Fillable(['alumni_profile_id', 'student_number', 'program_degree_id', 'graduation_year', 'honors', 'gwa'])]
class AlumniEducationRecord extends Model
{
    protected $table = 'alumni_education_records';

    protected function casts(): array
    {
        return [
            'gwa' => 'decimal:2',
            'graduation_year' => 'integer',
        ];
    }

    /**
     * @return BelongsTo<AlumniProfile, $this>
     */
    public function alumni(): BelongsTo
    {
        return $this->belongsTo(AlumniProfile::class, 'alumni_profile_id');
    }

    /**
     * @return BelongsTo<ProgramDegree, $this>
     */
    public function programDegree(): BelongsTo
    {
        return $this->belongsTo(ProgramDegree::class);
    }

    protected function setStudentNumberAttribute(string $value): void
    {
        $this->attributes['student_number'] = Str::upper(trim($value));
    }
}
