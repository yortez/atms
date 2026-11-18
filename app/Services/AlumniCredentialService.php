<?php

namespace App\Services;

use App\Models\AlumniProfile;
use App\Models\Role;
use App\Models\User;
use Illuminate\Support\Str;

class AlumniCredentialService
{
    public function generateBaseUsername(
        ?string $firstName,
        ?string $middleName,
        ?string $lastName,
        ?string $fullName = null,
    ): string {
        $resolvedFirst = trim((string) $firstName);
        $resolvedMiddle = trim((string) $middleName);
        $resolvedLast = trim((string) $lastName);

        if ($resolvedLast === '' && filled($fullName)) {
            [$resolvedFirst, $resolvedMiddle, $resolvedLast] = $this->parseFullName((string) $fullName);
        }

        $lastSlug = $this->slugifyLastName($resolvedLast);
        if ($lastSlug === '') {
            $lastSlug = 'alumni';
        }

        $initial = $this->extractInitial($resolvedFirst);
        if ($initial === '') {
            $initial = $this->extractInitial($resolvedMiddle);
        }

        return $initial !== '' ? "{$lastSlug}_{$initial}" : $lastSlug;
    }

    public function generateUniqueUsername(
        ?string $firstName,
        ?string $middleName,
        ?string $lastName,
        ?string $fullName = null,
        ?int $ignoreUserId = null,
    ): string {
        $base = $this->generateBaseUsername($firstName, $middleName, $lastName, $fullName);
        $base = Str::limit($base, 85, '');

        if (! $this->usernameExists($base, $ignoreUserId)) {
            return $base;
        }

        $suffix = 1;
        while ($this->usernameExists("{$base}{$suffix}", $ignoreUserId)) {
            $suffix++;
        }

        return "{$base}{$suffix}";
    }

    public function provisionForProfile(AlumniProfile $profile, ?string $studentNumber = null): ?User
    {
        $existingUser = User::query()
            ->where('alumni_profile_id', $profile->id)
            ->first();

        if ($existingUser !== null) {
            if (blank($existingUser->username)) {
                $existingUser->username = $this->generateUniqueUsername(
                    $profile->first_name,
                    $profile->middle_name,
                    $profile->last_name,
                    $profile->name,
                    $existingUser->id,
                );
                $existingUser->save();
            }

            $this->attachAlumniRole($existingUser);

            return $existingUser;
        }

        $resolvedStudentNumber = Str::upper(trim((string) (
            $studentNumber
            ?? $profile->studentNumbers()->orderBy('id')->value('student_number')
            ?? ''
        )));

        if ($resolvedStudentNumber === '') {
            return null;
        }

        $username = $this->generateUniqueUsername(
            $profile->first_name,
            $profile->middle_name,
            $profile->last_name,
            $profile->name,
        );

        $email = $this->resolveUniqueEmail((string) $profile->email, $username, $resolvedStudentNumber);

        $user = new User([
            'name' => $profile->name,
            'username' => $username,
            'email' => $email,
            'password' => $resolvedStudentNumber,
            'alumni_profile_id' => $profile->id,
        ]);
        $user->email_verified_at = now();
        $user->save();

        $this->attachAlumniRole($user);

        return $user;
    }

    private function usernameExists(string $username, ?int $ignoreUserId = null): bool
    {
        return User::withTrashed()
            ->where('username', $username)
            ->when($ignoreUserId !== null, fn ($query) => $query->whereKeyNot($ignoreUserId))
            ->exists();
    }

    private function resolveUniqueEmail(string $profileEmail, string $username, string $studentNumber): string
    {
        $candidate = Str::lower(trim($profileEmail));

        if ($candidate !== '' && ! User::withTrashed()->where('email', $candidate)->exists()) {
            return $candidate;
        }

        $snCandidate = Str::lower(preg_replace('/[^a-z0-9._-]+/i', '-', $studentNumber) ?: $username) . '@alumni.local';
        if (! User::withTrashed()->where('email', $snCandidate)->exists()) {
            return $snCandidate;
        }

        $baseCandidate = "{$username}@alumni.local";
        if (! User::withTrashed()->where('email', $baseCandidate)->exists()) {
            return $baseCandidate;
        }

        $suffix = 1;
        while (User::withTrashed()->where('email', "{$username}{$suffix}@alumni.local")->exists()) {
            $suffix++;
        }

        return "{$username}{$suffix}@alumni.local";
    }

    private function attachAlumniRole(User $user): void
    {
        $alumniRole = Role::query()->firstOrCreate(
            ['name' => 'alumni'],
            ['label' => 'Alumni'],
        );

        $user->roles()->syncWithoutDetaching([
            $alumniRole->id => ['created_at' => now()],
        ]);
    }

    /**
     * @return array{0: string, 1: string, 2: string}
     */
    public function parseFullName(string $fullName): array
    {
        $tokens = preg_split('/\s+/', trim($fullName)) ?: [];
        $count = count($tokens);

        if ($count === 0) {
            return ['', '', ''];
        }

        if ($count === 1) {
            return [$tokens[0], '', $tokens[0]];
        }

        for ($i = 1; $i < $count - 1; $i++) {
            $cleaned = Str::ascii($tokens[$i]);
            if (preg_match('/^[A-Za-z]\.?$/', $cleaned) === 1) {
                $first = implode(' ', array_slice($tokens, 0, $i));
                $middle = $tokens[$i];
                $last = implode(' ', array_slice($tokens, $i + 1));

                return [$first, $middle, $last];
            }
        }

        $first = (string) array_shift($tokens);
        $last = implode(' ', $tokens);

        return [$first, '', $last];
    }

    private function slugifyLastName(string $lastName): string
    {
        $ascii = Str::lower(Str::ascii(trim($lastName)));
        $underscored = preg_replace('/[^a-z0-9]+/', '_', $ascii) ?? '';

        return trim($underscored, '_');
    }

    private function extractInitial(string $namePart): string
    {
        $ascii = Str::lower(Str::ascii(trim($namePart)));
        if (preg_match('/[a-z]/', $ascii, $matches) === 1) {
            return $matches[0];
        }

        return '';
    }
}

