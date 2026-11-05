<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property Carbon|null $started_on
 * @property Carbon|null $ended_on
 * @property Carbon $reported_at
 */
#[Fillable([
    'alumni_id',
    'employment_status_id',
    'employer_id',
    'employer_name',
    'job_title',
    'industry',
    'employment_type',
    'work_location',
    'started_on',
    'ended_on',
    'reported_at',
    'reported_by_user_id',
])]
class AlumniEmploymentRecord extends Model
{
    /**
     * @return BelongsTo<AlumniProfile, $this>
     */
    public function alumni(): BelongsTo
    {
        return $this->belongsTo(AlumniProfile::class, 'alumni_id');
    }

    /**
     * @return BelongsTo<EmploymentStatus, $this>
     */
    public function status(): BelongsTo
    {
        return $this->belongsTo(EmploymentStatus::class, 'employment_status_id');
    }

    /**
     * @return BelongsTo<Employer, $this>
     */
    public function employer(): BelongsTo
    {
        return $this->belongsTo(Employer::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function reporter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reported_by_user_id');
    }

    protected function casts(): array
    {
        return [
            'started_on' => 'date',
            'ended_on' => 'date',
            'reported_at' => 'datetime',
        ];
    }
}
