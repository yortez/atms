<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('alumni_registration_assistance_requests', function (Blueprint $table) {
            $table->string('student_number')->nullable()->change();

            if (! Schema::hasColumn('alumni_registration_assistance_requests', 'first_name')) {
                $table->string('first_name', 100)->nullable()->after('name');
            }
            if (! Schema::hasColumn('alumni_registration_assistance_requests', 'middle_name')) {
                $table->string('middle_name', 100)->nullable()->after('first_name');
            }
            if (! Schema::hasColumn('alumni_registration_assistance_requests', 'last_name')) {
                $table->string('last_name', 100)->nullable()->after('middle_name');
            }
            if (! Schema::hasColumn('alumni_registration_assistance_requests', 'credential_delivery_method')) {
                $table->string('credential_delivery_method', 20)->nullable()->after('resolved_alumni_profile_id');
            }
            if (! Schema::hasColumn('alumni_registration_assistance_requests', 'released_username')) {
                $table->string('released_username', 100)->nullable()->after('credential_delivery_method');
            }
            if (! Schema::hasColumn('alumni_registration_assistance_requests', 'released_password')) {
                $table->text('released_password')->nullable()->after('released_username');
            }
        });
    }

    public function down(): void
    {
        Schema::table('alumni_registration_assistance_requests', function (Blueprint $table) {
            $columns = array_values(array_filter([
                'first_name',
                'middle_name',
                'last_name',
                'credential_delivery_method',
                'released_username',
                'released_password',
            ], fn (string $column) => Schema::hasColumn('alumni_registration_assistance_requests', $column)));

            if ($columns !== []) {
                $table->dropColumn($columns);
            }
        });
    }
};

