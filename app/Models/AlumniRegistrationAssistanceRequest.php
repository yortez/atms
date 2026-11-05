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
 * @property string|null $message
 * @property string $status
 */
#[Fillable([
    'name',
    'email',
    'date_of_birth',
    'student_number',
    'message',
    'status',
    'reviewed_by_user_id',
    'reviewed_at',
    'review_note',
])]
class AlumniRegistrationAssistanceRequest extends Model
{
    /**
     * @return BelongsTo<User, $this>
     */
    public function reviewedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by_user_id');
    }

    protected function casts(): array
    {
        return [
            'date_of_birth' => 'date',
            'reviewed_at' => 'datetime',
        ];
    }
}
