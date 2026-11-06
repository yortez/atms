<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('alumni_education_records', 'gwa')) {
            Schema::table('alumni_education_records', function (Blueprint $table) {
                $table->decimal('gwa', 4, 2)->nullable()->after('honors');
            });
        }

        if (! Schema::hasColumn('alumni_employment_records', 'is_related_to_degree')) {
            Schema::table('alumni_employment_records', function (Blueprint $table) {
                $table->boolean('is_related_to_degree')->default(true)->after('work_location');
            });
        }

        if (! Schema::hasColumn('job_applications', 'profile_snapshot')) {
            Schema::table('job_applications', function (Blueprint $table) {
                $table->json('profile_snapshot')->nullable()->after('cover_letter');
                $table->string('resume_snapshot_path')->nullable()->after('profile_snapshot');
            });
        }

        $hasProgramFk = collect(Schema::getForeignKeys('alumni_registration_assistance_requests'))
            ->contains(fn (array $fk) => in_array('academic_program_id', $fk['columns'] ?? [], true));

        Schema::table('alumni_registration_assistance_requests', function (Blueprint $table) use ($hasProgramFk) {
            if (! Schema::hasColumn('alumni_registration_assistance_requests', 'academic_program_id')) {
                $table->unsignedBigInteger('academic_program_id')->nullable()->after('student_number');
            }
            if (! $hasProgramFk) {
                $table->foreign('academic_program_id', 'arar_academic_program_fk')
                    ->references('id')
                    ->on('academic_programs')
                    ->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('alumni_registration_assistance_requests', function (Blueprint $table) {
            $table->dropForeign('arar_academic_program_fk');
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

