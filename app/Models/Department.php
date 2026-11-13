<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;

#[Fillable(['code', 'name', 'description', 'logo_path', 'is_active'])]
#[Hidden(['logo_path'])]
class Department extends Model
{
    protected $appends = ['logo'];

    protected function logo(): Attribute
    {
        return Attribute::get(fn (): ?string => $this->logo_path
            ? Storage::disk('public')->url($this->logo_path)
            : null);
    }

    /**
     * @return HasMany<AcademicProgram, $this>
     */
    public function programs(): HasMany
    {
        return $this->hasMany(AcademicProgram::class);
    }
}
