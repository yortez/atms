<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $employer_id
 * @property string $status
 * @property Carbon|null $closes_at
 * @property Carbon|null $published_at
 */
#[Fillable([
    'employer_id', 'title', 'description', 'location', 'employment_type', 'workplace_type',
    'salary_min', 'salary_max', 'closes_at', 'status', 'published_at',
])]
class JobPosting extends Model
{
    /**
     * @return BelongsTo<Employer, $this>
     */
    public function employer(): BelongsTo
    {
        return $this->belongsTo(Employer::class);
    }

    /**
     * @return HasMany<JobApplication, $this>
     */
    public function applications(): HasMany
    {
        return $this->hasMany(JobApplication::class);
    }

    protected function casts(): array
    {
        return ['closes_at' => 'date', 'published_at' => 'datetime'];
    }
}
