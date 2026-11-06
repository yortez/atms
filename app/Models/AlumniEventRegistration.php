<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $alumni_event_id
 * @property int $user_id
 * @property string $status
 * @property string|null $notes
 * @property Carbon $registered_at
 */
#[Fillable([
    'alumni_event_id',
    'user_id',
    'status',
    'notes',
    'registered_at',
])]
class AlumniEventRegistration extends Model
{
    protected $table = 'alumni_event_registrations';

    /**
     * @return BelongsTo<AlumniEvent, $this>
     */
    public function event(): BelongsTo
    {
        return $this->belongsTo(AlumniEvent::class, 'alumni_event_id');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    protected function casts(): array
    {
        return [
            'registered_at' => 'datetime',
        ];
    }
}

