<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $job_posting_id
 * @property int $alumni_profile_id
 * @property int $applicant_user_id
 * @property string $status
 */
#[Fillable([
    'job_posting_id', 'alumni_profile_id', 'applicant_user_id', 'cover_letter', 'status',
    'reviewed_at', 'reviewed_by_user_id',
])]
class JobApplication extends Model
{
    /**
     * @return BelongsTo<JobPosting, $this>
     */
    public function jobPosting(): BelongsTo
    {
        return $this->belongsTo(JobPosting::class);
    }

    /**
     * @return BelongsTo<AlumniProfile, $this>
     */
    public function alumniProfile(): BelongsTo
    {
        return $this->belongsTo(AlumniProfile::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function applicant(): BelongsTo
    {
        return $this->belongsTo(User::class, 'applicant_user_id');
    }

    protected function casts(): array
    {
        return ['reviewed_at' => 'datetime'];
    }
}
