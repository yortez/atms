<?php

namespace Database\Seeders;

use App\Models\AcademicProgram;
use App\Models\Employer;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class SystemAdminSeeder extends Seeder
{
    /**
     * Create the default system administrator account and dedicated role demo accounts.
     */
    public function run(): void
    {
        $roleMap = [
            'system-administrator' => 'System Administrator',
            'alumni-coordinator' => 'Alumni Coordinator',
            'department-coordinator' => 'Department Coordinator',
            'alumni' => 'Alumni',
            'employer' => 'Employer',
        ];

        $roles = [];
        foreach ($roleMap as $name => $label) {
            $roles[$name] = Role::query()->firstOrCreate(
                ['name' => $name],
                ['label' => $label],
            );
        }

        $password = (string) env('ADMIN_PASSWORD', 'Password123!');
        $adminEmail = (string) env('ADMIN_EMAIL', 'admin@atms.local');
        $adminName = (string) env('ADMIN_NAME', 'System Administrator');

        // 1. System Administrator
        $admin = $this->upsertAccount($adminEmail, $adminName, $password);
        $admin->roles()->syncWithoutDetaching([
            $roles['system-administrator']->id => ['created_at' => now()],
        ]);

        if (Str::lower(trim($adminEmail)) !== 'admin@atms.local') {
            $defaultAdmin = $this->upsertAccount('admin@atms.local', 'System Administrator', $password);
            $defaultAdmin->roles()->syncWithoutDetaching([
                $roles['system-administrator']->id => ['created_at' => now()],
            ]);
        }

        // 2. Dedicated Alumni Coordinator
        $alumniCoordinator = $this->upsertAccount('coordinator@atms.local', 'Elena Vance (Alumni Coordinator)', $password);
        $alumniCoordinator->roles()->sync([
            $roles['alumni-coordinator']->id => [
                'assigned_by_user_id' => $admin->id,
                'created_at' => now(),
            ],
        ]);

        // 3. Dedicated Department Coordinator (School of Computing / BSCS & BSIT)
        $deptCoordinator = $this->upsertAccount('dept.ccs@atms.local', 'Dr. Alan Grant (Dept. Coordinator)', $password);
        $deptCoordinator->roles()->sync([
            $roles['department-coordinator']->id => [
                'assigned_by_user_id' => $admin->id,
                'created_at' => now(),
            ],
        ]);

        $computingPrograms = AcademicProgram::query()
            ->whereIn('code', ['BSCS', 'BSIT', 'CS', 'IT'])
            ->pluck('id');
        if ($computingPrograms->isEmpty()) {
            $computingPrograms = AcademicProgram::query()->limit(2)->pluck('id');
        }
        if ($computingPrograms->isNotEmpty()) {
            $programSync = $computingPrograms->mapWithKeys(fn (int $programId): array => [
                $programId => [
                    'assigned_by_user_id' => $admin->id,
                    'created_at' => now(),
                ],
            ])->all();
            $deptCoordinator->assignedPrograms()->syncWithoutDetaching($programSync);
            $admin->assignedPrograms()->syncWithoutDetaching($programSync);
        }

        // 4. Dedicated Employer Partner Account
        $employerUser = $this->upsertAccount('employer@atms.local', 'Sophia Lin (TechNova HR)', $password);
        $employerUser->roles()->sync([
            $roles['employer']->id => [
                'assigned_by_user_id' => $admin->id,
                'created_at' => now(),
            ],
        ]);

        if (! $employerUser->employers()->exists()) {
            $company = Employer::query()->firstOrCreate(
                ['contact_email' => 'careers@technova.example.com'],
                [
                    'company_name' => 'TechNova Solutions Inc.',
                    'industry' => 'Information Technology & Cloud Services',
                    'website' => 'https://technova.example.com',
                    'contact_phone' => '+63 2 8555 0199',
                    'address' => 'BGC, Taguig City, Metro Manila',
                    'registration_number' => 'SEC-2024-88912',
                    'description' => 'Official university industry partner specializing in enterprise software and graduate career programs.',
                    'verification_status' => 'verified',
                    'reviewed_by_user_id' => $admin->id,
                    'verified_at' => now(),
                ],
            );

            $company->users()->syncWithoutDetaching([
                $employerUser->id => [
                    'membership_role' => 'owner',
                    'created_at' => now(),
                ],
            ]);
        }
    }

    private function upsertAccount(string $email, string $name, string $password): User
    {
        $normalizedEmail = Str::lower(trim($email));

        $user = User::query()->firstOrCreate(
            ['email' => $normalizedEmail],
            [
                'name' => $name,
                'password' => $password,
                'email_verified_at' => now(),
            ],
        );

        $user->forceFill([
            'name' => $name,
            'email' => $normalizedEmail,
            'email_verified_at' => $user->email_verified_at ?? now(),
        ])->save();

        return $user;
    }
}
