<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('alumni_events')) {
            Schema::create('alumni_events', function (Blueprint $table) {
                $table->id();
                $table->string('title', 180);
                $table->longText('description');
                $table->string('event_type', 40)->default('homecoming')->index();
                $table->string('format', 24)->default('in_person')->index();
                $table->string('venue', 200)->nullable();
                $table->string('meeting_url', 500)->nullable();
                $table->timestamp('starts_at')->useCurrent()->index();
                $table->timestamp('ends_at')->nullable();
                $table->timestamp('registration_deadline')->nullable();
                $table->unsignedInteger('capacity')->nullable();
                $table->boolean('is_featured')->default(false)->index();
                $table->boolean('is_public')->default(true)->index();
                $table->json('audience_roles')->nullable();
                $table->json('target_department_ids')->nullable();
                $table->json('target_program_ids')->nullable();
                $table->json('target_graduation_years')->nullable();
                $table->string('status', 20)->default('draft')->index();
                $table->timestamp('published_at')->nullable();
                $table->foreignId('created_by_user_id')->constrained('users')->restrictOnDelete();
                $table->timestamps();
                $table->index(['status', 'starts_at']);
            });
        }

        if (! Schema::hasTable('alumni_event_registrations')) {
            Schema::create('alumni_event_registrations', function (Blueprint $table) {
                $table->id();
                $table->foreignId('alumni_event_id')->constrained('alumni_events')->cascadeOnDelete();
                $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
                $table->string('status', 24)->default('going')->index();
                $table->string('notes', 500)->nullable();
                $table->timestamp('registered_at')->useCurrent();
                $table->timestamps();
                $table->unique(['alumni_event_id', 'user_id']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('alumni_event_registrations');
        Schema::dropIfExists('alumni_events');
    }
};

