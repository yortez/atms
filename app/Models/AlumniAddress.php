<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'alumni_id',
    'address_type',
    'line_1',
    'line_2',
    'city',
    'province',
    'postal_code',
    'country_code',
    'is_primary',
])]
class AlumniAddress extends Model
{
    /**
     * @return BelongsTo<AlumniProfile, $this>
     */
    public function alumni(): BelongsTo
    {
        return $this->belongsTo(AlumniProfile::class, 'alumni_id');
    }

    protected function casts(): array
    {
        return ['is_primary' => 'boolean'];
    }
}
