<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $hasReviewedByFk = collect(Schema::getForeignKeys('alumni_registration_assistance_requests'))
            ->contains(fn (array $fk) => in_array('reviewed_by_user_id', $fk['columns'] ?? [], true));

        Schema::table('alumni_registration_assistance_requests', function (Blueprint $table) use ($hasReviewedByFk) {
            if (! Schema::hasColumn('alumni_registration_assistance_requests', 'reviewed_by_user_id')) {
                $table->unsignedBigInteger('reviewed_by_user_id')->nullable();
            }
            if (! $hasReviewedByFk) {
                $table->foreign('reviewed_by_user_id', 'arar_reviewed_by_user_fk')
                    ->references('id')
                    ->on('users')
                    ->nullOnDelete();
            }
            if (! Schema::hasColumn('alumni_registration_assistance_requests', 'reviewed_at')) {
                $table->timestamp('reviewed_at')->nullable();
            }
            if (! Schema::hasColumn('alumni_registration_assistance_requests', 'review_note')) {
                $table->text('review_note')->nullable();
            }
        });

        if (! Schema::hasColumn('alumni_profiles', 'first_name')) {
            Schema::table('alumni_profiles', function (Blueprint $table) {
                $table->string('first_name', 100)->nullable()->index();
                $table->string('middle_name', 100)->nullable();
                $table->string('last_name', 100)->nullable();
                $table->string('suffix', 30)->nullable();
                $table->string('preferred_name', 100)->nullable();
                $table->string('profile_status', 24)->default('active')->index();
                $table->unsignedBigInteger('merged_into_alumni_id')->nullable();
                $table->foreignId('created_by_user_id')->nullable()->constrained('users')->nullOnDelete();
                $table->foreign('merged_into_alumni_id')->references('id')->on('alumni_profiles')->nullOnDelete();
                $table->index(['last_name', 'first_name']);
            });
        }

        if (Schema::hasTable('alumni_student_numbers') && ! Schema::hasTable('alumni_education_records')) {
            Schema::rename('alumni_student_numbers', 'alumni_education_records');
        }

        if (! Schema::hasColumn('alumni_education_records', 'program_degree_id')) {
            Schema::table('alumni_education_records', function (Blueprint $table) {
                $table->foreignId('program_degree_id')->nullable()->constrained('program_degrees')->restrictOnDelete();
                $table->unsignedSmallInteger('graduation_year')->nullable();
                $table->string('honors', 120)->nullable();
                $table->index(['alumni_profile_id', 'graduation_year'], 'aer_profile_grad_year_idx');
                $table->index(['program_degree_id', 'graduation_year'], 'aer_prog_degree_grad_year_idx');
            });
        }

        if (! Schema::hasTable('alumni_contact_methods')) {
            Schema::create('alumni_contact_methods', function (Blueprint $table) {
                $table->id();
                $table->foreignId('alumni_id')->constrained('alumni_profiles')->cascadeOnDelete();
                $table->string('type', 16);
                $table->string('value');
                $table->boolean('is_primary')->default(false);
                $table->boolean('is_verified')->default(false);
                $table->timestamp('verified_at')->nullable();
                $table->timestamps();
                $table->index(['alumni_id', 'type']);
                $table->index(['type', 'value']);
            });
        }

        if (! Schema::hasTable('alumni_addresses')) {
            Schema::create('alumni_addresses', function (Blueprint $table) {
                $table->id();
                $table->foreignId('alumni_id')->constrained('alumni_profiles')->cascadeOnDelete();
                $table->string('address_type', 24);
                $table->string('line_1', 180);
                $table->string('line_2', 180)->nullable();
                $table->string('city', 120)->nullable();
                $table->string('province', 120)->nullable();
                $table->string('postal_code', 20)->nullable();
                $table->char('country_code', 2);
                $table->boolean('is_primary')->default(false);
                $table->timestamps();
                $table->index(['alumni_id', 'address_type']);
            });
        }

        if (! Schema::hasTable('alumni_claim_requests')) {
            Schema::create('alumni_claim_requests', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->cascadeOnDelete();
                $table->string('student_number', 64);
                $table->foreignId('education_record_id')->nullable()->constrained('alumni_education_records')->nullOnDelete();
                $table->string('status', 24)->default('pending');
                $table->timestamp('submitted_at')->useCurrent();
                $table->foreignId('reviewed_by_user_id')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamp('reviewed_at')->nullable();
                $table->text('decision_note')->nullable();
                $table->timestamps();
                $table->index(['student_number', 'status']);
                $table->index(['user_id', 'submitted_at']);
                $table->index(['education_record_id', 'status']);
            });
        }

        if (! Schema::hasTable('alumni_profile_merge_logs')) {
            Schema::create('alumni_profile_merge_logs', function (Blueprint $table) {
                $table->id();
                $table->foreignId('source_alumni_id')->constrained('alumni_profiles')->restrictOnDelete();
                $table->unique('source_alumni_id');
                $table->foreignId('target_alumni_id')->constrained('alumni_profiles')->restrictOnDelete();
                $table->foreignId('merged_by_user_id')->nullable()->constrained('users')->nullOnDelete();
                $table->text('reason');
                $table->timestamp('merged_at')->useCurrent();
                $table->json('snapshot')->nullable();
                $table->index(['target_alumni_id', 'merged_at']);
            });
        }

        if (! Schema::hasTable('employment_statuses')) {
            Schema::create('employment_statuses', function (Blueprint $table) {
                $table->smallIncrements('id');
                $table->string('code', 40)->unique();
                $table->string('label', 100);
                $table->boolean('is_active')->default(true);
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('employers')) {
            Schema::create('employers', function (Blueprint $table) {
                $table->id();
                $table->string('company_name', 180);
                $table->string('website', 255)->nullable();
                $table->text('description')->nullable();
                $table->string('industry', 120)->nullable();
                $table->string('registration_number', 100)->nullable()->index();
                $table->string('contact_email', 255);
                $table->string('contact_phone', 40)->nullable();
                $table->text('address')->nullable();
                $table->string('verification_status', 24)->default('pending')->index();
                $table->timestamp('verified_at')->nullable();
                $table->foreignId('reviewed_by_user_id')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();
                $table->index(['verification_status', 'company_name']);
            });
        }

        if (! Schema::hasTable('employer_users')) {
            Schema::create('employer_users', function (Blueprint $table) {
                $table->foreignId('employer_id')->constrained()->cascadeOnDelete();
                $table->foreignId('user_id')->constrained()->cascadeOnDelete();
                $table->string('membership_role', 24)->default('owner');
                $table->timestamp('created_at')->nullable();
                $table->primary(['employer_id', 'user_id']);
                $table->index(['user_id', 'employer_id']);
            });
        }

        if (! Schema::hasTable('alumni_employment_records')) {
            Schema::create('alumni_employment_records', function (Blueprint $table) {
                $table->id();
                $table->foreignId('alumni_id')->constrained('alumni_profiles')->restrictOnDelete();
                $table->unsignedSmallInteger('employment_status_id');
                $table->foreign('employment_status_id')->references('id')->on('employment_statuses')->restrictOnDelete();
                $table->foreignId('employer_id')->nullable()->constrained()->nullOnDelete();
                $table->string('employer_name', 180)->nullable();
                $table->string('job_title', 160)->nullable();
                $table->string('industry', 120)->nullable();
                $table->string('employment_type', 32)->nullable();
                $table->string('work_location', 180)->nullable();
                $table->date('started_on')->nullable();
                $table->date('ended_on')->nullable();
                $table->timestamp('reported_at')->useCurrent();
                $table->foreignId('reported_by_user_id')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();
                $table->index(['alumni_id', 'reported_at']);
                $table->index(['employment_status_id', 'reported_at'], 'aemp_status_reported_at_idx');
                $table->index(['alumni_id', 'started_on']);
            });
        }

        if (! Schema::hasTable('alumni_documents')) {
            Schema::create('alumni_documents', function (Blueprint $table) {
                $table->id();
                $table->foreignId('alumni_id')->constrained('alumni_profiles')->cascadeOnDelete();
                $table->foreignId('uploaded_by_user_id')->constrained('users')->cascadeOnDelete();
                $table->string('document_type', 24);
                $table->string('disk', 32);
                $table->string('path', 512);
                $table->string('original_name', 255);
                $table->string('mime_type', 120);
                $table->unsignedBigInteger('size_bytes');
                $table->timestamp('uploaded_at')->useCurrent();
                $table->timestamps();
                $table->index(['alumni_id', 'document_type']);
                $table->index('path');
            });
        }

        if (! Schema::hasTable('privacy_notice_acceptances')) {
            Schema::create('privacy_notice_acceptances', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->cascadeOnDelete();
                $table->string('notice_version', 40);
                $table->timestamp('accepted_at')->useCurrent();
                $table->string('ip_address', 45)->nullable();
                $table->timestamps();
                $table->unique(['user_id', 'notice_version']);
                $table->index('accepted_at');
            });
        }

        if (! Schema::hasTable('activity_logs')) {
            Schema::create('activity_logs', function (Blueprint $table) {
                $table->id();
                $table->foreignId('actor_user_id')->nullable()->constrained('users')->nullOnDelete();
                $table->string('action', 100);
                $table->string('subject_type', 120)->nullable();
                $table->unsignedBigInteger('subject_id')->nullable();
                $table->json('metadata')->nullable();
                $table->string('ip_address', 45)->nullable();
                $table->timestamp('created_at')->useCurrent();
                $table->index(['actor_user_id', 'created_at']);
                $table->index(['action', 'created_at']);
                $table->index(['subject_type', 'subject_id', 'created_at']);
            });
        }

        if (! Schema::hasTable('notifications')) {
            Schema::create('notifications', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->string('type');
                $table->morphs('notifiable');
                $table->json('data');
                $table->timestamp('read_at')->nullable();
                $table->timestamps();
                $table->index(['notifiable_type', 'notifiable_id', 'read_at'], 'notifications_recipient_read_idx');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('notifications');
        Schema::dropIfExists('activity_logs');
        Schema::dropIfExists('privacy_notice_acceptances');
        Schema::dropIfExists('alumni_documents');
        Schema::dropIfExists('alumni_employment_records');
        Schema::dropIfExists('employer_users');
        Schema::dropIfExists('employers');
        Schema::dropIfExists('employment_statuses');
        Schema::dropIfExists('alumni_profile_merge_logs');
        Schema::dropIfExists('alumni_claim_requests');
        Schema::dropIfExists('alumni_addresses');
        Schema::dropIfExists('alumni_contact_methods');
        Schema::table('alumni_education_records', function (Blueprint $table) {
            $table->dropConstrainedForeignId('program_degree_id');
            $table->dropIndex('aer_profile_grad_year_idx');
            $table->dropIndex('aer_prog_degree_grad_year_idx');
            $table->dropColumn(['graduation_year', 'honors']);
        });
        Schema::rename('alumni_education_records', 'alumni_student_numbers');
        Schema::table('alumni_profiles', function (Blueprint $table) {
            $table->dropForeign(['merged_into_alumni_id']);
            $table->dropConstrainedForeignId('created_by_user_id');
            $table->dropIndex(['last_name', 'first_name']);
            $table->dropColumn([
                'first_name',
                'middle_name',
                'last_name',
                'suffix',
                'preferred_name',
                'profile_status',
                'merged_into_alumni_id',
            ]);
        });
        Schema::table('alumni_registration_assistance_requests', function (Blueprint $table) {
            $table->dropForeign('arar_reviewed_by_user_fk');
            $table->dropColumn(['reviewed_by_user_id', 'reviewed_at', 'review_note']);
        });
    }
};
