<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('alumni_profiles', function (Blueprint $table) {
            if (! Schema::hasColumn('alumni_profiles', 'gender')) {
                $table->string('gender', 32)->nullable()->after('preferred_name');
            }
            if (! Schema::hasColumn('alumni_profiles', 'civil_status')) {
                $table->string('civil_status', 32)->nullable()->after('gender');
            }
            if (! Schema::hasColumn('alumni_profiles', 'contact_number')) {
                $table->string('contact_number', 64)->nullable()->after('civil_status');
            }
            if (! Schema::hasColumn('alumni_profiles', 'current_address')) {
                $table->text('current_address')->nullable()->after('contact_number');
            }
            if (! Schema::hasColumn('alumni_profiles', 'permanent_address')) {
                $table->text('permanent_address')->nullable()->after('current_address');
            }
        });
    }

    public function down(): void
    {
        Schema::table('alumni_profiles', function (Blueprint $table) {
            $table->dropColumn([
                'gender',
                'civil_status',
                'contact_number',
                'current_address',
                'permanent_address',
            ]);
        });
    }
};

