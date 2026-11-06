<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('alumni_education_records', function (Blueprint $table) {
            $table->decimal('gwa', 4, 2)->nullable()->after('honors');
        });

        Schema::table('alumni_employment_records', function (Blueprint $table) {
            $table->boolean('is_related_to_degree')->default(true)->after('work_location');
        });

        Schema::table('job_applications', function (Blueprint $table) {
            $table->json('profile_snapshot')->nullable()->after('cover_letter');
            $table->string('resume_snapshot_path')->nullable()->after('profile_snapshot');
        });

        Schema::table('alumni_registration_assistance_requests', function (Blueprint $table) {
            $table->foreignId('academic_program_id')->nullable()->after('student_number')
                ->constrained('academic_programs')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('alumni_registration_assistance_requests', function (Blueprint $table) {
            $table->dropForeign(['academic_program_id']);
            $table->dropColumn('academic_program_id');
        });

        Schema::table('job_applications', function (Blueprint $table) {
            $table->dropColumn(['profile_snapshot', 'resume_snapshot_path']);
        });

        Schema::table('alumni_employment_records', function (Blueprint $table) {
            $table->dropColumn('is_related_to_degree');
        });

        Schema::table('alumni_education_records', function (Blueprint $table) {
            $table->dropColumn('gwa');
        });
    }
};

