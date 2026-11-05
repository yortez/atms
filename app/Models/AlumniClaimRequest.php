<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $status
 * @property Carbon $submitted_at
 */
#[Fillable([
    'user_id',
    'student_number',
    'education_record_id',
    'status',
    'submitted_at',
    'reviewed_by_user_id',
    'reviewed_at',
    'decision_note',
])]
class AlumniClaimRequest extends Model
{
    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return BelongsTo<AlumniStudentNumber, $this>
     */
    public function educationRecord(): BelongsTo
    {
        return $this->belongsTo(AlumniStudentNumber::class, 'education_record_id');
    }

    protected function casts(): array
    {
        return [
            'submitted_at' => 'datetime',
            'reviewed_at' => 'datetime',
        ];
    }
}
