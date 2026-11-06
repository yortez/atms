<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('alumni_registration_assistance_requests', function (Blueprint $table) {
            $table->unsignedSmallInteger('graduation_year')->nullable()->after('academic_program_id');
            $table->string('resolution_action', 40)->nullable()->after('review_note');
            $table->foreignId('resolved_alumni_profile_id')
                ->nullable()
                ->after('resolution_action')
                ->constrained('alumni_profiles')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('alumni_registration_assistance_requests', function (Blueprint $table) {
            $table->dropConstrainedForeignId('resolved_alumni_profile_id');
            $table->dropColumn(['graduation_year', 'resolution_action']);
        });
    }
};

