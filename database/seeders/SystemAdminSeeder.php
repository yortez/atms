<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class SystemAdminSeeder extends Seeder
{
    /**
     * Create the default system administrator account.
     */
    public function run(): void
    {
        $role = Role::query()->firstOrCreate(
            ['name' => 'system-administrator'],
            ['label' => 'System Administrator'],
        );

        $email = 'admin@atms.local';
        $name = 'System Administrator';
        $password = 'Password123!';

        $user = User::query()->firstOrCreate(
            ['email' => Str::lower($email)],
            [
                'name' => $name,
                'password' => $password,
                'email_verified_at' => now(),
            ],
        );

        $user->forceFill([
            'name' => $name,
            'email' => Str::lower($email),
            'email_verified_at' => $user->email_verified_at ?? now(),
        ])->save();

        $user->roles()->syncWithoutDetaching([
            $role->id => ['created_at' => now()],
        ]);
    }
}
