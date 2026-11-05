<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $name
 * @property string $email
 * @property Carbon $date_of_birth
 * @property string|null $first_name
 * @property string|null $middle_name
 * @property string|null $last_name
 * @property string|null $suffix
 * @property string|null $preferred_name
 * @property string $profile_status
 * @property int|null $merged_into_alumni_id
 */
#[Fillable([
    'name',
    'email',
    'date_of_birth',
    'first_name',
    'middle_name',
    'last_name',
    'suffix',
    'preferred_name',
    'profile_status',
    'merged_into_alumni_id',
    'created_by_user_id',
])]
class AlumniProfile extends Model
{
    /**
     * @return HasMany<AlumniStudentNumber, $this>
     */
    public function studentNumbers(): HasMany
    {
        return $this->hasMany(AlumniStudentNumber::class, 'alumni_profile_id');
    }

    /**
     * @return HasMany<AlumniEducationRecord, $this>
     */
    public function educationRecords(): HasMany
    {
        return $this->hasMany(AlumniEducationRecord::class, 'alumni_profile_id');
    }

    /**
     * @return HasMany<AlumniContactMethod, $this>
     */
    public function contactMethods(): HasMany
    {
        return $this->hasMany(AlumniContactMethod::class, 'alumni_id');
    }

    /**
     * @return HasMany<AlumniAddress, $this>
     */
    public function addresses(): HasMany
    {
        return $this->hasMany(AlumniAddress::class, 'alumni_id');
    }

    /**
     * @return HasMany<AlumniEmploymentRecord, $this>
     */
    public function employmentRecords(): HasMany
    {
        return $this->hasMany(AlumniEmploymentRecord::class, 'alumni_id')
            ->latest('reported_at');
    }

    /**
     * @return HasMany<AlumniDocument, $this>
     */
    public function documents(): HasMany
    {
        return $this->hasMany(AlumniDocument::class, 'alumni_id');
    }

    /**
     * @return HasOne<User, $this>
     */
    public function user(): HasOne
    {
        return $this->hasOne(User::class, 'alumni_profile_id');
    }

    /**
     * @return BelongsTo<AlumniProfile, $this>
     */
    public function mergedInto(): BelongsTo
    {
        return $this->belongsTo(self::class, 'merged_into_alumni_id');
    }

    /**
     * @return HasMany<AlumniProfile, $this>
     */
    public function mergedProfiles(): HasMany
    {
        return $this->hasMany(self::class, 'merged_into_alumni_id');
    }

    protected function casts(): array
    {
        return [
            'date_of_birth' => 'date',
        ];
    }
}
