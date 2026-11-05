<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $disk
 * @property string $path
 * @property string $original_name
 * @property string $mime_type
 * @property int $size_bytes
 * @property Carbon $uploaded_at
 */
#[Fillable([
    'alumni_id',
    'uploaded_by_user_id',
    'document_type',
    'disk',
    'path',
    'original_name',
    'mime_type',
    'size_bytes',
    'uploaded_at',
])]
class AlumniDocument extends Model
{
    /**
     * @return BelongsTo<AlumniProfile, $this>
     */
    public function alumni(): BelongsTo
    {
        return $this->belongsTo(AlumniProfile::class, 'alumni_id');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by_user_id');
    }

    protected function casts(): array
    {
        return ['uploaded_at' => 'datetime'];
    }
}
