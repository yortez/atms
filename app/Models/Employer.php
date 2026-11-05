<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $verification_status
 * @property Carbon|null $verified_at
 */
#[Fillable([
    'company_name',
    'website',
    'description',
    'industry',
    'registration_number',
    'contact_email',
    'contact_phone',
    'address',
    'verification_status',
    'verified_at',
    'reviewed_by_user_id',
])]
class Employer extends Model
{
    /**
     * @return BelongsToMany<User, $this>
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'employer_users', 'employer_id', 'user_id')
            ->withPivot('membership_role', 'created_at');
    }

    /**
     * @return HasMany<AlumniEmploymentRecord, $this>
     */
    public function employmentRecords(): HasMany
    {
        return $this->hasMany(AlumniEmploymentRecord::class);
    }

    /**
     * @return HasMany<JobPosting, $this>
     */
    public function jobs(): HasMany
    {
        return $this->hasMany(JobPosting::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by_user_id');
    }

    protected function casts(): array
    {
        return ['verified_at' => 'datetime'];
    }
}
