<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['code', 'title', 'degree_level'])]
class Degree extends Model
{
    /**
     * @return HasMany<ProgramDegree, $this>
     */
    public function programDegrees(): HasMany
    {
        return $this->hasMany(ProgramDegree::class);
    }
}
