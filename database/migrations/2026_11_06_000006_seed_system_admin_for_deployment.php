<?php

use Database\Seeders\EmploymentStatusSeeder;
use Database\Seeders\RoleSeeder;
use Database\Seeders\SystemAdminSeeder;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        if (app()->runningUnitTests()) {
            return;
        }

        app(RoleSeeder::class)->run();
        app(EmploymentStatusSeeder::class)->run();
        app(SystemAdminSeeder::class)->run();
    }

    public function down(): void
    {
        // Reference data and system administrator account are retained on rollback.
    }
};

