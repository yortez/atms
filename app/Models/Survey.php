<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $status
 * @property Carbon|null $closes_at
 */
#[Fillable(['title', 'description', 'status', 'published_at', 'closes_at', 'created_by_user_id'])]
class Survey extends Model
{
    /**
     * @return HasMany<SurveyQuestion, $this>
     */
    public function questions(): HasMany
    {
        return $this->hasMany(SurveyQuestion::class)->orderBy('position');
    }

    /**
     * @return HasMany<SurveyResponse, $this>
     */
    public function responses(): HasMany
    {
        return $this->hasMany(SurveyResponse::class);
    }

    protected function casts(): array
    {
        return ['published_at' => 'datetime', 'closes_at' => 'datetime'];
    }
}
