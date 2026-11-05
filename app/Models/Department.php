<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['code', 'name', 'description', 'is_active'])]
class Department extends Model
{
    /**
     * @return HasMany<AcademicProgram, $this>
     */
    public function programs(): HasMany
    {
        return $this->hasMany(AcademicProgram::class);
    }
}
