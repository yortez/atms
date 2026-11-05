<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['program_id', 'degree_id', 'is_active'])]
class ProgramDegree extends Model
{
    /**
     * @return BelongsTo<AcademicProgram, $this>
     */
    public function program(): BelongsTo
    {
        return $this->belongsTo(AcademicProgram::class);
    }

    /**
     * @return BelongsTo<Degree, $this>
     */
    public function degree(): BelongsTo
    {
        return $this->belongsTo(Degree::class);
    }

    /**
     * @return HasMany<AlumniStudentNumber, $this>
     */
    public function educationRecords(): HasMany
    {
        return $this->hasMany(AlumniStudentNumber::class, 'program_degree_id');
    }
}
