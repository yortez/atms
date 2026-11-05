<?php

namespace App\Console\Commands;

use App\Models\Role;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Str;

class CreateSystemAdminCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:create-system-admin {--name=System Administrator} {--email=admin@atms.local} {--password=Password123!}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Create or update the system administrator account';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $role = Role::query()->firstOrCreate(
            ['name' => 'system-administrator'],
            ['label' => 'System Administrator'],
        );

        $name = trim((string) $this->option('name')) ?: 'System Administrator';
        $email = Str::lower(trim((string) $this->option('email')) ?: 'admin@atms.local');
        $password = (string) $this->option('password');

        $user = User::query()->firstOrCreate(
            ['email' => $email],
            [
                'name' => $name,
                'password' => $password,
                'email_verified_at' => now(),
            ],
        );

        $user->forceFill([
            'name' => $name,
            'email' => $email,
            'email_verified_at' => $user->email_verified_at ?? now(),
        ])->save();

        $user->roles()->syncWithoutDetaching([
            $role->id => ['created_at' => now()],
        ]);

        $this->info("System administrator ready: {$user->email}");

        return self::SUCCESS;
    }
}
