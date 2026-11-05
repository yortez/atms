<?php

namespace App\Policies;

use App\Models\AlumniProfile;
use App\Models\User;

class AlumniProfilePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasRole('system-administrator', 'alumni-coordinator', 'department-coordinator')
            || $user->hasPermission('alumni.view');
    }

    public function view(User $user, AlumniProfile $profile): bool
    {
        if ($user->alumni_profile_id === $profile->id) {
            return true;
        }

        if ($user->hasRole('system-administrator', 'alumni-coordinator')) {
            return true;
        }

        return $user->hasRole('department-coordinator')
            && $this->withinAssignedPrograms($user, $profile);
    }

    public function update(User $user, AlumniProfile $profile): bool
    {
        if ($user->alumni_profile_id === $profile->id) {
            return true;
        }

        if (! $user->hasPermission('alumni.update')) {
            return false;
        }

        if ($user->hasRole('alumni-coordinator')) {
            return true;
        }

        return $user->hasRole('department-coordinator')
            && $this->withinAssignedPrograms($user, $profile);
    }

    public function create(User $user): bool
    {
        return $user->hasRole('system-administrator', 'alumni-coordinator')
            || $user->hasPermission('alumni.create');
    }

    public function delete(User $user, AlumniProfile $profile): bool
    {
        return $user->hasRole('system-administrator');
    }

    private function withinAssignedPrograms(User $user, AlumniProfile $profile): bool
    {
        $programIds = $user->assignedPrograms()->select('academic_programs.id');

        return $profile->educationRecords()
            ->whereHas('programDegree', fn ($query) => $query->whereIn('program_id', $programIds))
            ->exists();
    }
}
