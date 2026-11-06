<?php

namespace App\Actions\Fortify;

use App\Concerns\PasswordValidationRules;
use App\Concerns\ProfileValidationRules;
use App\Models\AlumniProfile;
use App\Models\AlumniRegistrationAssistanceRequest;
use App\Models\AlumniStudentNumber;
use App\Models\Employer;
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
        $registrationType = isset($input['registration_type']) && is_string($input['registration_type'])
            ? strtolower(trim($input['registration_type']))
            : 'alumni';

        if ($registrationType === 'employer') {
            return $this->createEmployerUser($input);
        }

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
            'last_name' => ['nullable', 'string', 'max:100'],
        ])->validate();

        $inputLastName = ! empty($input['last_name']) && is_string($input['last_name'])
            ? trim($input['last_name'])
            : $this->extractLastName($input['name'] ?? '');

        $user = DB::transaction(function () use ($input, $inputLastName): ?User {
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

            if ($profile === null || $profile->user()->exists()) {
                return null;
            }

            $profileLastName = ! empty($profile->last_name)
                ? trim($profile->last_name)
                : $this->extractLastName($profile->name ?? '');

            if (
                $this->normalizeName($profileLastName) !== $this->normalizeName($inputLastName)
                || $profile->date_of_birth->toDateString() !== $input['date_of_birth']
            ) {
                return null;
            }

            $user = new User([
                'name' => $input['name'] ?? $profile->name,
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

            $existingStudentNumber = AlumniStudentNumber::query()
                ->with('programDegree')
                ->where('student_number', $input['student_number'])
                ->first();

            $programId = $existingStudentNumber?->programDegree?->program_id;

            AlumniRegistrationAssistanceRequest::create([
                'name' => $input['name'] ?? $inputLastName,
                'email' => $input['email'],
                'student_number' => $input['student_number'],
                'date_of_birth' => $input['date_of_birth'],
                'academic_program_id' => $programId,
                'status' => 'pending',
                'message' => 'Automated assistance request submitted due to registration credential mismatch.',
            ]);

            $this->logger->record('assistance_requested', $input['student_number']);

            throw ValidationException::withMessages([
                'student_number' => 'We could not verify your details with our records. A registration assistance request has been submitted for review by your Department Coordinator.',
            ]);
        }

        return $user;
    }

    /**
     * @param  array<string, mixed>  $input
     */
    private function createEmployerUser(array $input): User
    {
        if (is_string($input['email'] ?? null)) {
            $input['email'] = Str::lower(trim($input['email']));
        }

        if (is_string($input['name'] ?? null)) {
            $input['name'] = trim($input['name']);
        }

        Validator::make($input, [
            ...$this->profileRules(),
            'company_name' => ['required', 'string', 'max:180'],
            'industry' => ['nullable', 'string', 'max:120'],
            'website' => ['nullable', 'url', 'max:255'],
            'contact_phone' => ['nullable', 'string', 'max:40'],
            'address' => ['nullable', 'string', 'max:500'],
            'password' => $this->passwordRules(),
        ])->validate();

        return DB::transaction(function () use ($input): User {
            $user = new User([
                'name' => $input['name'],
                'email' => $input['email'],
                'password' => $input['password'],
            ]);
            $user->email_verified_at = Carbon::instance(now());
            $user->save();

            $employerRole = Role::query()->firstOrCreate(
                ['name' => 'employer'],
                ['label' => 'Employer'],
            );
            $user->roles()->syncWithoutDetaching([
                $employerRole->id => ['created_at' => now()],
            ]);

            $employer = Employer::create([
                'company_name' => trim((string) $input['company_name']),
                'industry' => ! empty($input['industry']) ? trim((string) $input['industry']) : null,
                'website' => ! empty($input['website']) ? trim((string) $input['website']) : null,
                'contact_email' => $input['email'],
                'contact_phone' => ! empty($input['contact_phone']) ? trim((string) $input['contact_phone']) : null,
                'address' => ! empty($input['address']) ? trim((string) $input['address']) : null,
                'verification_status' => 'pending',
            ]);

            $employer->users()->attach($user->id, [
                'membership_role' => 'owner',
                'created_at' => now(),
            ]);

            return $user;
        });
    }

    private function extractLastName(string $name): string
    {
        $parts = preg_split('/\s+/', trim($name));

        return $parts ? (string) end($parts) : '';
    }

    private function normalizeName(string $name): string
    {
        return preg_replace('/\s+/', ' ', Str::lower(trim($name))) ?? '';
    }
}
