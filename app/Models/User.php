<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;
use Laravel\Fortify\Contracts\PasskeyUser;
use Laravel\Fortify\PasskeyAuthenticatable;
use Laravel\Fortify\TwoFactorAuthenticatable;
use Laravel\Sanctum\HasApiTokens;

/**
 * @property int $id
 * @property string $name
 * @property string $email
 * @property int|null $alumni_profile_id
 * @property Carbon|null $email_verified_at
 * @property Carbon|null $suspended_at
 * @property string $password
 * @property string|null $two_factor_secret
 * @property string|null $two_factor_recovery_codes
 * @property Carbon|null $two_factor_confirmed_at
 * @property string|null $remember_token
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['name', 'email', 'password', 'alumni_profile_id'])]
#[Hidden(['password', 'two_factor_secret', 'two_factor_recovery_codes', 'remember_token', 'avatar_path'])]
class User extends Authenticatable implements MustVerifyEmail, PasskeyUser
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable, PasskeyAuthenticatable, SoftDeletes, TwoFactorAuthenticatable;

    protected $appends = ['avatar'];

    /**
     * @return BelongsTo<AlumniProfile, $this>
     */
    public function alumniProfile(): BelongsTo
    {
        return $this->belongsTo(AlumniProfile::class);
    }

    /**
     * @return BelongsToMany<Role, $this>
     */
    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class, 'user_roles', 'user_id', 'role_id')
            ->withPivot(['assigned_by_user_id', 'created_at']);
    }

    /**
     * @return BelongsToMany<AcademicProgram, $this>
     */
    public function assignedPrograms(): BelongsToMany
    {
        return $this->belongsToMany(AcademicProgram::class, 'user_program_assignments', 'user_id', 'program_id')
            ->withPivot(['assigned_by_user_id', 'created_at']);
    }

    /**
     * @return BelongsToMany<Employer, $this>
     */
    public function employers(): BelongsToMany
    {
        return $this->belongsToMany(Employer::class, 'employer_users', 'user_id', 'employer_id')
            ->withPivot(['membership_role', 'created_at']);
    }

    public function hasRole(string ...$roles): bool
    {
        return $this->roles()->whereIn('name', $roles)->exists();
    }

    public function isSuspended(): bool
    {
        return $this->suspended_at !== null;
    }

    protected function avatar(): Attribute
    {
        return Attribute::get(fn (): ?string => $this->avatar_path
            ? Storage::disk('public')->url($this->avatar_path)
            : null);
    }

    public function hasPermission(string $permission): bool
    {
        return $this->roles()
            ->whereHas('permissions', fn ($query) => $query->where('name', $permission))
            ->exists();
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'suspended_at' => 'datetime',
            'two_factor_confirmed_at' => 'datetime',
        ];
    }
}
