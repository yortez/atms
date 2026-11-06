<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('users', 'alumni_profile_id')) {
            Schema::table('users', function (Blueprint $table) {
                $table->foreignId('alumni_profile_id')
                    ->nullable()
                    ->unique()
                    ->constrained()
                    ->nullOnDelete();
            });
        }
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('alumni_profile_id');
        });
    }
};
