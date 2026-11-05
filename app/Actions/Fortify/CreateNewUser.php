<?php

namespace App\Actions\Fortify;

use App\Concerns\PasswordValidationRules;
use App\Concerns\ProfileValidationRules;
use App\Models\AlumniProfile;
use App\Models\AlumniStudentNumber;
use App\Models\Role;
use App\Models\User;
use App\Services\AlumniRegistrationLogger;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Laravel\Fortify\Contracts\CreatesNewUsers;

class CreateNewUser implements CreatesNewUsers
{
    use PasswordValidationRules, ProfileValidationRules;

    public function __construct(private AlumniRegistrationLogger $logger) {}

    /**
     * Validate and create a newly registered user.
     *
     * @param  array<string, mixed>  $input
     */
    public function create(array $input): User
    {
        $rateLimitKey = 'alumni-registration:'.request()->ip();

        if (RateLimiter::tooManyAttempts($rateLimitKey, 10)) {
            throw ValidationException::withMessages([
                'student_number' => 'Too many registration attempts. Please try again later.',
            ]);
        }

        RateLimiter::hit($rateLimitKey, 60);
        $this->logger->record(
            'registration_attempt',
            is_string($input['student_number'] ?? null) ? $input['student_number'] : '',
        );

        if (is_string($input['email'] ?? null)) {
            $input['email'] = Str::lower(trim($input['email']));
        }

        if (is_string($input['student_number'] ?? null)) {
            $input['student_number'] = Str::upper(trim($input['student_number']));
        }

        if (is_string($input['name'] ?? null)) {
            $input['name'] = trim($input['name']);
        }

        Validator::make($input, [
            ...$this->profileRules(),
            'student_number' => ['required', 'string', 'max:255'],
            'date_of_birth' => ['required', 'date_format:Y-m-d'],
            'password' => $this->passwordRules(),
        ])->validate();

        $user = DB::transaction(function () use ($input): ?User {
            $studentNumber = AlumniStudentNumber::query()
                ->where('student_number', $input['student_number'])
                ->lockForUpdate()
                ->first();

            if ($studentNumber === null) {
                return null;
            }

            $profile = AlumniProfile::query()
                ->whereKey($studentNumber->alumni_profile_id)
                ->lockForUpdate()
                ->first();

            if (
                $profile === null
                || $profile->user()->exists()
                || $this->normalizeName($profile->name) !== $this->normalizeName($input['name'])
                || Str::lower(trim($profile->email)) !== $input['email']
                || $profile->date_of_birth->toDateString() !== $input['date_of_birth']
            ) {
                return null;
            }

            $user = new User([
                'name' => $input['name'],
                'email' => $input['email'],
                'password' => $input['password'],
                'alumni_profile_id' => $profile->id,
            ]);
            $user->email_verified_at = Carbon::instance(now());
            $user->save();
            $alumniRole = Role::query()->firstOrCreate(
                ['name' => 'alumni'],
                ['label' => 'Alumni'],
            );
            $user->roles()->syncWithoutDetaching([
                $alumniRole->id => ['created_at' => now()],
            ]);

            $this->logger->record('registration_completed', $input['student_number'], $user, $profile);
            $this->logger->record('account_auto_verified', $input['student_number'], $user, $profile);

            return $user;
        });

        if ($user === null) {
            $this->logger->record('registration_denied', $input['student_number']);

            throw ValidationException::withMessages([
                'student_number' => 'We could not verify these details. If your alumni record needs updating, request administrative assistance.',
            ]);
        }

        return $user;
    }

    private function normalizeName(string $name): string
    {
        return preg_replace('/\s+/', ' ', Str::lower(trim($name))) ?? '';
    }
}
