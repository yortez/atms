<?php

namespace App\Policies;

use App\Models\Employer;
use App\Models\User;

class EmployerPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasRole('system-administrator', 'alumni-coordinator');
    }

    public function view(User $user, Employer $employer): bool
    {
        return $user->hasRole('system-administrator', 'alumni-coordinator')
            || $employer->users()->whereKey($user->id)->exists();
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, Employer $employer): bool
    {
        return $user->hasRole('system-administrator', 'alumni-coordinator')
            || $employer->users()->whereKey($user->id)->exists();
    }

    public function review(User $user): bool
    {
        return $user->hasRole('system-administrator', 'alumni-coordinator');
    }
}
