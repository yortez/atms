<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        $roleLabels = [
            'system-administrator' => 'System Administrator',
            'alumni-coordinator' => 'Alumni Coordinator',
            'department-coordinator' => 'Department Coordinator',
            'alumni' => 'Alumni',
            'employer' => 'Employer',
        ];

        foreach ($roleLabels as $name => $label) {
            Role::query()->firstOrCreate(['name' => $name], ['label' => $label]);
        }

        $permissionLabels = [
            'alumni.view' => 'View alumni records',
            'alumni.create' => 'Create alumni records',
            'alumni.update' => 'Update alumni records',
            'reports.view' => 'View reports',
            'surveys.manage' => 'Manage alumni surveys',
            'announcements.manage' => 'Manage announcements',
            'jobs.manage' => 'Manage job postings and applications',
        ];

        foreach ($permissionLabels as $name => $label) {
            Permission::query()->firstOrCreate(['name' => $name], ['label' => $label]);
        }

        Role::query()->where('name', 'alumni-coordinator')->firstOrFail()
            ->permissions()->syncWithoutDetaching(
                Permission::query()->whereIn('name', [
                    'alumni.view',
                    'alumni.create',
                    'alumni.update',
                    'reports.view',
                    'surveys.manage',
                    'announcements.manage',
                    'jobs.manage',
                ])->pluck('id'),
            );
        Role::query()->where('name', 'department-coordinator')->firstOrFail()
            ->permissions()->syncWithoutDetaching(
                Permission::query()->whereIn('name', ['alumni.view', 'reports.view'])->pluck('id'),
            );
    }
}
