<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $name
 * @property string $email
 * @property Carbon $date_of_birth
 * @property string $student_number
 * @property int|null $academic_program_id
 * @property int|null $graduation_year
 * @property string|null $message
 * @property string $status
 * @property int|null $reviewed_by_user_id
 * @property Carbon|null $reviewed_at
 * @property string|null $review_note
 * @property string|null $resolution_action
 * @property int|null $resolved_alumni_profile_id
 */
#[Fillable([
    'name',
    'email',
    'date_of_birth',
    'student_number',
    'academic_program_id',
    'graduation_year',
    'message',
    'status',
    'reviewed_by_user_id',
    'reviewed_at',
    'review_note',
    'resolution_action',
    'resolved_alumni_profile_id',
])]
class AlumniRegistrationAssistanceRequest extends Model
{
    /**
     * @return BelongsTo<AcademicProgram, $this>
     */
    public function program(): BelongsTo
    {
        return $this->belongsTo(AcademicProgram::class, 'academic_program_id');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function reviewedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by_user_id');
    }

    /**
     * @return BelongsTo<AlumniProfile, $this>
     */
    public function resolvedProfile(): BelongsTo
    {
        return $this->belongsTo(AlumniProfile::class, 'resolved_alumni_profile_id');
    }

    protected function casts(): array
    {
        return [
            'date_of_birth' => 'date:Y-m-d',
            'graduation_year' => 'integer',
            'reviewed_at' => 'datetime',
        ];
    }
}
