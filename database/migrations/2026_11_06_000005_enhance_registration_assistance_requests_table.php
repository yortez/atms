<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $hasResolvedProfileFk = collect(Schema::getForeignKeys('alumni_registration_assistance_requests'))
            ->contains(fn (array $fk) => in_array('resolved_alumni_profile_id', $fk['columns'] ?? [], true));

        Schema::table('alumni_registration_assistance_requests', function (Blueprint $table) use ($hasResolvedProfileFk) {
            if (! Schema::hasColumn('alumni_registration_assistance_requests', 'graduation_year')) {
                $table->unsignedSmallInteger('graduation_year')->nullable()->after('academic_program_id');
            }
            if (! Schema::hasColumn('alumni_registration_assistance_requests', 'resolution_action')) {
                $table->string('resolution_action', 40)->nullable()->after('review_note');
            }
            if (! Schema::hasColumn('alumni_registration_assistance_requests', 'resolved_alumni_profile_id')) {
                $table->unsignedBigInteger('resolved_alumni_profile_id')->nullable()->after('resolution_action');
            }
            if (! $hasResolvedProfileFk) {
                $table->foreign('resolved_alumni_profile_id', 'arar_resolved_profile_fk')
                    ->references('id')
                    ->on('alumni_profiles')
                    ->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('alumni_registration_assistance_requests', function (Blueprint $table) {
            $table->dropForeign('arar_resolved_profile_fk');
            $table->dropColumn(['graduation_year', 'resolution_action', 'resolved_alumni_profile_id']);
        });
    }
};

