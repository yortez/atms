<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['code', 'label', 'is_active'])]
class EmploymentStatus extends Model
{
    protected $table = 'employment_statuses';

    /**
     * @return HasMany<AlumniEmploymentRecord, $this>
     */
    public function records(): HasMany
    {
        return $this->hasMany(AlumniEmploymentRecord::class);
    }
}
