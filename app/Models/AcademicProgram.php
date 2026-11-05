<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['department_id', 'code', 'name', 'description', 'is_active'])]
class AcademicProgram extends Model
{
    /**
     * @return BelongsTo<Department, $this>
     */
    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    /**
     * @return HasMany<ProgramDegree, $this>
     */
    public function programDegrees(): HasMany
    {
        return $this->hasMany(ProgramDegree::class, 'program_id');
    }

    /**
     * @return BelongsToMany<User, $this>
     */
    public function assignedCoordinators(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'user_program_assignments', 'program_id')
            ->withPivot(['assigned_by_user_id', 'created_at']);
    }
}
