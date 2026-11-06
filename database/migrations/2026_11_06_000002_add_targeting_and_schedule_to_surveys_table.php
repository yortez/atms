<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('surveys', function (Blueprint $table) {
            if (! Schema::hasColumn('surveys', 'starts_at')) {
                $table->timestamp('starts_at')->nullable()->after('published_at');
            }
            if (! Schema::hasColumn('surveys', 'is_anonymous')) {
                $table->boolean('is_anonymous')->default(false)->after('closes_at');
            }
            if (! Schema::hasColumn('surveys', 'target_department_ids')) {
                $table->json('target_department_ids')->nullable()->after('is_anonymous');
            }
            if (! Schema::hasColumn('surveys', 'target_program_ids')) {
                $table->json('target_program_ids')->nullable()->after('target_department_ids');
            }
            if (! Schema::hasColumn('surveys', 'target_graduation_years')) {
                $table->json('target_graduation_years')->nullable()->after('target_program_ids');
            }
        });
    }

    public function down(): void
    {
        Schema::table('surveys', function (Blueprint $table) {
            $table->dropColumn([
                'starts_at',
                'is_anonymous',
                'target_department_ids',
                'target_program_ids',
                'target_graduation_years',
            ]);
        });
    }
};
