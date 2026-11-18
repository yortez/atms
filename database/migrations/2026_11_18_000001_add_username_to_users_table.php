<?php

use App\Models\AlumniProfile;
use App\Services\AlumniCredentialService;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('users', 'username')) {
            Schema::table('users', function (Blueprint $table) {
                $table->string('username', 100)->nullable()->unique()->after('name');
            });
        }

        if (Schema::hasTable('alumni_profiles')) {
            /** @var AlumniCredentialService $credentialService */
            $credentialService = app(AlumniCredentialService::class);

            AlumniProfile::query()
                ->with(['user', 'studentNumbers'])
                ->chunkById(100, function ($profiles) use ($credentialService): void {
                    foreach ($profiles as $profile) {
                        if ($profile->user !== null || $profile->studentNumbers->isNotEmpty()) {
                            $credentialService->provisionForProfile($profile);
                        }
                    }
                });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('users', 'username')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropUnique(['username']);
                $table->dropColumn('username');
            });
        }
    }
};

