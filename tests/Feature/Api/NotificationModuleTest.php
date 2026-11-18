<?php

use App\Models\AcademicProgram;
use App\Models\AlumniProfile;
use App\Models\Degree;
use App\Models\Department;
use App\Models\Employer;
use App\Models\EmploymentStatus;
use App\Models\JobPosting;
use App\Models\ProgramDegree;
use App\Models\Role;
use App\Models\Survey;
use App\Models\User;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;

function notificationRole(User $user, string $roleName): void
{
    $role = Role::query()->firstOrCreate(['name' => $roleName], ['label' => str($roleName)->headline()]);
    $user->roles()->syncWithoutDetaching([$role->id => ['created_at' => now()]]);
}

function notificationCompleteProfile(User $user, string $name = 'Notify Alumnus'): AlumniProfile
{
    $profile = AlumniProfile::create([
        'name' => $name,
        'first_name' => explode(' ', $name)[0],
        'last_name' => explode(' ', $name)[1] ?? 'Alumnus',
        'email' => strtolower(str_replace(' ', '.', $name)).'@example.test',
        'date_of_birth' => '1997-04-12',
        'gender' => 'Female',
        'civil_status' => 'Single',
        'contact_number' => '+63 912 000 1111',
        'current_address' => 'Tupi, South Cotabato',
        'permanent_address' => 'Tupi, South Cotabato',
    ]);
    $user->alumniProfile()->associate($profile);
    $user->save();
    notificationRole($user, 'alumni');

    return $profile;
}

test('notification endpoints require authentication', function () {
    $this->getJson('/api/notifications')->assertUnauthorized();
    $this->patchJson('/api/notifications/read-all')->assertUnauthorized();
    $this->patchJson('/api/notifications/non-existent/read')->assertUnauthorized();
});

test('users can list unread count, mark single notification read, mark all read, and cannot modify another user notification', function () {
    $user = User::factory()->create();
    $otherUser = User::factory()->create();

    $n1 = $user->notifications()->create([
        'id' => (string) Str::uuid(),
        'type' => 'App\\Notifications\\AnnouncementPublished',
        'data' => ['title' => 'First update', 'message' => 'Hello world'],
    ]);
    $n2 = $user->notifications()->create([
        'id' => (string) Str::uuid(),
        'type' => 'App\\Notifications\\EventPublished',
        'data' => ['title' => 'Second update', 'message' => 'Event tomorrow'],
    ]);
    $otherNotification = $otherUser->notifications()->create([
        'id' => (string) Str::uuid(),
        'type' => 'App\\Notifications\\AnnouncementPublished',
        'data' => ['title' => 'Private update', 'message' => 'Not yours'],
    ]);

    Sanctum::actingAs($user, ['api']);

    // List only own notifications + accurate unread_count
    $this->getJson('/api/notifications')
        ->assertOk()
        ->assertJsonCount(2, 'data.data')
        ->assertJsonPath('meta.unread_count', 2);

    // Cannot mark another user's notification as read
    $this->patchJson("/api/notifications/{$otherNotification->id}/read")
        ->assertNotFound();
    expect($otherNotification->fresh()->read_at)->toBeNull();

    // Mark single notification read
    $this->patchJson("/api/notifications/{$n1->id}/read")
        ->assertOk()
        ->assertJsonPath('data.id', $n1->id);

    expect($n1->fresh()->read_at)->not->toBeNull()
        ->and($n2->fresh()->read_at)->toBeNull();

    $this->getJson('/api/notifications')
        ->assertOk()
        ->assertJsonPath('meta.unread_count', 1);

    // Mark all remaining notifications read
    $this->patchJson('/api/notifications/read-all')
        ->assertOk()
        ->assertJsonPath('data.marked_count', 1);

    expect($n2->fresh()->read_at)->not->toBeNull()
        ->and($otherNotification->fresh()->read_at)->toBeNull();

    $this->getJson('/api/notifications')
        ->assertOk()
        ->assertJsonPath('meta.unread_count', 0);
});

test('employment report and employer verification create database notifications', function () {
    $alumnusUser = User::factory()->create();
    $profile = notificationCompleteProfile($alumnusUser, 'Jane Tracer');
    $status = EmploymentStatus::firstOrCreate(['code' => 'employed'], ['label' => 'Employed']);

    Sanctum::actingAs($alumnusUser, ['api']);
    $this->postJson("/api/alumni/{$profile->id}/employment", [
        'employment_status_id' => $status->id,
        'employer_name' => 'SEAIT Tech',
        'started_on' => '2025-01-15',
    ])->assertCreated();

    expect($alumnusUser->notifications()->where('type', 'App\\Notifications\\AlumniEmploymentReported')->count())->toBe(1);

    $employerOwner = User::factory()->create();
    $employer = Employer::create([
        'company_name' => 'Mindanao Systems',
        'contact_email' => 'hr@mindanao.test',
        'verification_status' => 'pending',
    ]);
    $employer->users()->attach($employerOwner->id, ['membership_role' => 'owner', 'created_at' => now()]);
    notificationRole($employerOwner, 'employer');

    $coordinator = User::factory()->create();
    notificationRole($coordinator, 'alumni-coordinator');
    Sanctum::actingAs($coordinator, ['api']);

    $this->patchJson("/api/employers/{$employer->id}/verification", [
        'verification_status' => 'verified',
    ])->assertOk();

    expect($employerOwner->notifications()->where('type', 'App\\Notifications\\EmployerVerificationUpdated')->count())->toBe(1);
});

test('publishing announcements and events broadcasts notifications to targeted users', function () {
    $coordinator = User::factory()->create();
    notificationRole($coordinator, 'alumni-coordinator');

    $alumnus = User::factory()->create();
    notificationCompleteProfile($alumnus, 'Mark Target');

    $employer = User::factory()->create();
    notificationRole($employer, 'employer');

    Sanctum::actingAs($coordinator, ['api']);

    $this->postJson('/api/announcements', [
        'title' => 'Annual Homecoming',
        'body' => 'Join us for the alumni homecoming.',
        'category' => 'general',
        'publish_now' => true,
        'notify_audience' => true,
        'audience_roles' => ['alumni'],
    ])->assertCreated();

    $this->postJson('/api/events', [
        'title' => 'Career Expo',
        'description' => 'Meet top regional employers.',
        'event_type' => 'career_fair',
        'format' => 'in_person',
        'venue' => 'SEAIT Gymnasium',
        'starts_at' => now()->addDays(10)->toDateTimeString(),
        'publish_now' => true,
        'notify_audience' => true,
        'audience_roles' => ['alumni'],
    ])->assertCreated();

    expect($alumnus->notifications()->where('type', 'App\\Notifications\\AnnouncementPublished')->count())->toBe(1)
        ->and($alumnus->notifications()->where('type', 'App\\Notifications\\EventPublished')->count())->toBe(1)
        ->and($employer->notifications()->count())->toBe(0);
});

test('job application submission notifies employer and status review notifies alumni applicant', function () {
    $employerOwner = User::factory()->create();
    $employer = Employer::create([
        'company_name' => 'Acme Software',
        'contact_email' => 'jobs@acme.test',
        'verification_status' => 'verified',
        'verified_at' => now(),
    ]);
    $employer->users()->attach($employerOwner->id, ['membership_role' => 'owner', 'created_at' => now()]);
    notificationRole($employerOwner, 'employer');

    $job = JobPosting::create([
        'employer_id' => $employer->id,
        'title' => 'Backend Developer',
        'description' => 'Build APIs in Laravel.',
        'status' => 'published',
        'published_at' => now(),
    ]);

    $applicantUser = User::factory()->create();
    notificationCompleteProfile($applicantUser, 'Clarisse Applicant');

    Sanctum::actingAs($applicantUser, ['api']);
    $applyRes = $this->postJson("/api/jobs/{$job->id}/applications", [
        'cover_letter' => 'Excited to apply for Backend Developer.',
    ])->assertCreated();

    $applicationId = $applyRes->json('data.id');

    expect($employerOwner->notifications()->where('type', 'App\\Notifications\\JobApplicationReceived')->count())->toBe(1)
        ->and($employerOwner->notifications()->first()?->data['application_id'])->toBe($applicationId);

    Sanctum::actingAs($employerOwner, ['api']);
    $this->patchJson("/api/applications/{$applicationId}/status", [
        'status' => 'shortlisted',
    ])->assertOk();

    $statusNotification = $applicantUser->notifications()
        ->where('type', 'App\\Notifications\\JobApplicationStatusUpdated')
        ->first();

    expect($statusNotification)->not->toBeNull()
        ->and($statusNotification->data['status'])->toBe('shortlisted')
        ->and($statusNotification->data['message'])->toContain('Backend Developer')
        ->and($statusNotification->data['message'])->toContain('shortlisted');
});

test('publishing a cohort-targeted survey notifies matching alumni only', function () {
    $dept = Department::create(['code' => 'CCS-NOTIF', 'name' => 'Computing Studies']);
    $programA = AcademicProgram::create(['department_id' => $dept->id, 'code' => 'BSIT-N', 'name' => 'BS Information Technology']);
    $programB = AcademicProgram::create(['department_id' => $dept->id, 'code' => 'BSCS-N', 'name' => 'BS Computer Science']);
    $degree = Degree::create(['code' => 'BS-N', 'title' => 'Bachelor of Science', 'degree_level' => 'bachelor']);
    $offeringA = ProgramDegree::create(['program_id' => $programA->id, 'degree_id' => $degree->id]);
    $offeringB = ProgramDegree::create(['program_id' => $programB->id, 'degree_id' => $degree->id]);

    $matchingUser = User::factory()->create();
    $matchingProfile = notificationCompleteProfile($matchingUser, 'Match Alumni');
    $matchingProfile->educationRecords()->create([
        'student_number' => '2020-80001',
        'program_degree_id' => $offeringA->id,
        'graduation_year' => 2024,
    ]);

    $nonMatchingUser = User::factory()->create();
    $nonMatchingProfile = notificationCompleteProfile($nonMatchingUser, 'Other Alumni');
    $nonMatchingProfile->educationRecords()->create([
        'student_number' => '2020-80002',
        'program_degree_id' => $offeringB->id,
        'graduation_year' => 2024,
    ]);

    $coordinator = User::factory()->create();
    notificationRole($coordinator, 'alumni-coordinator');

    $survey = Survey::create([
        'title' => 'BSIT Tracer 2026',
        'description' => 'Targeted outcomes check.',
        'status' => 'draft',
        'target_program_ids' => [$programA->id],
        'created_by_user_id' => $coordinator->id,
    ]);
    $survey->questions()->create([
        'prompt' => 'Are you currently employed?',
        'type' => 'yes_no',
        'is_required' => true,
        'position' => 0,
    ]);

    Sanctum::actingAs($coordinator, ['api']);
    $this->postJson("/api/surveys/{$survey->id}/publish")->assertOk();

    expect($matchingUser->notifications()->where('type', 'App\\Notifications\\SurveyPublished')->count())->toBe(1)
        ->and($nonMatchingUser->notifications()->where('type', 'App\\Notifications\\SurveyPublished')->count())->toBe(0);
});
