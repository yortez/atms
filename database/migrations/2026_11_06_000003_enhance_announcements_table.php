<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('announcements', function (Blueprint $table) {
            if (! Schema::hasColumn('announcements', 'category')) {
                $table->string('category', 40)->default('general')->after('body')->index();
            }
            if (! Schema::hasColumn('announcements', 'is_pinned')) {
                $table->boolean('is_pinned')->default(false)->after('category')->index();
            }
            if (! Schema::hasColumn('announcements', 'is_public')) {
                $table->boolean('is_public')->default(true)->after('is_pinned')->index();
            }
            if (! Schema::hasColumn('announcements', 'action_label')) {
                $table->string('action_label', 80)->nullable()->after('is_public');
            }
            if (! Schema::hasColumn('announcements', 'action_url')) {
                $table->string('action_url', 500)->nullable()->after('action_label');
            }
            if (! Schema::hasColumn('announcements', 'target_department_ids')) {
                $table->json('target_department_ids')->nullable()->after('audience_roles');
            }
            if (! Schema::hasColumn('announcements', 'target_program_ids')) {
                $table->json('target_program_ids')->nullable()->after('target_department_ids');
            }
            if (! Schema::hasColumn('announcements', 'target_graduation_years')) {
                $table->json('target_graduation_years')->nullable()->after('target_program_ids');
            }
            if (! Schema::hasColumn('announcements', 'expires_at')) {
                $table->timestamp('expires_at')->nullable()->after('published_at');
            }
        });
    }

    public function down(): void
    {
        Schema::table('announcements', function (Blueprint $table) {
            $table->dropIndex(['category']);
            $table->dropIndex(['is_pinned']);
            $table->dropIndex(['is_public']);
            $table->dropColumn([
                'category',
                'is_pinned',
                'is_public',
                'action_label',
                'action_url',
                'target_department_ids',
                'target_program_ids',
                'target_graduation_years',
                'expires_at',
            ]);
        });
    }
};

