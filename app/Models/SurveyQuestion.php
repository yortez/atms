<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property string $type
 * @property bool $is_required
 * @property array<int, string>|null $options
 */
#[Fillable(['survey_id', 'prompt', 'type', 'options', 'is_required', 'position'])]
class SurveyQuestion extends Model
{
    /**
     * @return BelongsTo<Survey, $this>
     */
    public function survey(): BelongsTo
    {
        return $this->belongsTo(Survey::class);
    }

    protected function casts(): array
    {
        return ['options' => 'array', 'is_required' => 'boolean'];
    }
}
