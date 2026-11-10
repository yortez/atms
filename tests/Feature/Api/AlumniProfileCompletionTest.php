<?php

use App\Models\AlumniEvent;
use App\Models\AlumniProfile;
use App\Models\EmploymentStatus;
use App\Models\JobPosting;
use App\Models\Role;
use App\Models\Survey;
use App\Models\User;
use Laravel\Sanctum\Sanctum;

function createTestAlumniUser(array $profileOverrides = []): array
{
    $role = Role::firstOrCreate(['name' => 'alumni'], ['label' => 'Alumni']);
    $profile = AlumniProfile::create(array_merge([
        'name' => 'Incomplete Alumni',
        'first_name' => 'Incomplete',
        'last_name' => 'Alumni',
        'email' => 'incomplete.' . uniqid() . '@example.test',
        'date_of_birth' => '1995-01-01',
    ], $profileOverrides));

    $user = User::factory()->create([
        'email_verified_at' => now(),
        'alumni_profile_id' => $profile->id,
    ]);
    $user->roles()->syncWithoutDetaching([$role->id]);

    return [$user, $profile];
}

test('isComplete accurately checks all five required fields: gender, civil_status, contact_number, current_address, permanent_address', function () {
    $profile = AlumniProfile::create([
        'name' => 'Test Profile',
        'email' => 'test@example.test',
        'date_of_birth' => '1996-01-01',
    ]);

    expect($profile->isComplete())->toBeFalse();
    expect($profile->missingProfileFields())->toBe([
        'gender',
        'civil_status',
        'contact_number',
        'current_address',
        'permanent_address',
    ]);

    $profile->update([
        'gender' => 'Male',
        'civil_status' => 'Single',
        'contact_number' => '+63 912 345 6789',
        'current_address' => 'Koronadal City',
        'permanent_address' => 'Surallah',
    ]);

    expect($profile->refresh()->isComplete())->toBeTrue();
    expect($profile->missingProfileFields())->toBeEmpty();
});

test('alumni with incomplete profile cannot apply for jobs and receives 403', function () {
    [$user, $profile] = createTestAlumniUser();

    $employer = \App\Models\Employer::create([
        'company_name' => 'ACME Corp',
        'contact_email' => 'acme@example.test',
        'verification_status' => 'verified',
    ]);
    $job = JobPosting::create([
        'employer_id' => $employer->id,
        'title' => 'Backend Engineer',
        'description' => 'Great role.',
        'status' => 'published',
    ]);

    Sanctum::actingAs($user, ['api']);

    $response = $this->postJson("/api/jobs/{$job->id}/applications", [
        'cover_letter' => 'Please consider my application.',
    ]);

    $response->assertStatus(403);
    $response->assertJsonFragment([
        'message' => 'Please complete your profile (gender, civil status, contact number, current address, and permanent address) before applying for jobs.',
    ]);
});

test('alumni with incomplete profile cannot respond to surveys and receives 403', function () {
    [$user, $profile] = createTestAlumniUser();

    $survey = Survey::create([
        'title' => 'Graduate Career Survey',
        'status' => 'published',
        'starts_at' => now()->subDay(),
        'created_by_user_id' => $user->id,
    ]);

    Sanctum::actingAs($user, ['api']);

    $response = $this->postJson("/api/surveys/{$survey->id}/responses", [
        'answers' => [],
    ]);

    $response->assertStatus(403);
    $response->assertJsonFragment([
        'message' => 'Please complete your profile (gender, civil status, contact number, current address, and permanent address) before answering surveys.',
    ]);
});

test('alumni with incomplete profile cannot RSVP to events and receives 403', function () {
    [$user, $profile] = createTestAlumniUser();

    $event = AlumniEvent::create([
        'title' => 'Homecoming Gala',
        'description' => 'Annual gathering.',
        'starts_at' => now()->addDays(5),
        'status' => 'published',
        'created_by_user_id' => $user->id,
    ]);

    Sanctum::actingAs($user, ['api']);

    $response = $this->postJson("/api/events/{$event->id}/rsvp", [
        'status' => 'going',
    ]);

    $response->assertStatus(403);
    $response->assertJsonFragment([
        'message' => 'Please complete your profile (gender, civil status, contact number, current address, and permanent address) before participating in events.',
    ]);
});

test('alumni can update their profile information and unlock access to system offerings', function () {
    [$user, $profile] = createTestAlumniUser();

    Sanctum::actingAs($user, ['api']);

    // 1. Initially incomplete
    $meRes = $this->getJson('/api/me/alumni')->assertOk();
    expect($meRes->json('data.is_complete'))->toBeFalse();
    expect($meRes->json('data.missing_fields'))->toContain('gender', 'civil_status', 'contact_number', 'current_address', 'permanent_address');

    // 2. Alumni updates profile with required fields
    $updateRes = $this->patchJson("/api/alumni/{$profile->id}", [
        'preferred_name' => 'Inky',
        'gender' => 'Male',
        'civil_status' => 'Single',
        'contact_number' => '+63 912 345 6789',
        'current_address' => 'Koronadal City, South Cotabato',
        'permanent_address' => 'Surallah, South Cotabato',
    ])->assertOk();

    expect($updateRes->json('data.is_complete'))->toBeTrue();
    expect($updateRes->json('data.preferred_name'))->toBe('Inky');
    expect($updateRes->json('data.gender'))->toBe('Male');
    expect($updateRes->json('data.civil_status'))->toBe('Single');
    expect($updateRes->json('data.contact_number'))->toBe('+63 912 345 6789');
    expect($updateRes->json('data.current_address'))->toBe('Koronadal City, South Cotabato');
    expect($updateRes->json('data.permanent_address'))->toBe('Surallah, South Cotabato');
    expect($updateRes->json('data.missing_fields'))->toBeEmpty();

    // 3. User can now RSVP to event
    $event = AlumniEvent::create([
        'title' => 'Unlocked Networking Event',
        'description' => 'Alumni only.',
        'starts_at' => now()->addDays(7),
        'status' => 'published',
        'created_by_user_id' => $user->id,
    ]);

    $this->postJson("/api/events/{$event->id}/rsvp", [
        'status' => 'going',
    ])->assertOk();

    // 4. User can now report employment tracer
    $status = EmploymentStatus::firstOrCreate(['code' => 'employed', 'label' => 'Employed', 'is_active' => true]);
    $this->postJson("/api/alumni/{$profile->id}/employment", [
        'employment_status_id' => $status->id,
        'employer_name' => 'SEAIT Dev Hub',
        'job_title' => 'Software Engineer',
        'started_on' => '2024-01-01',
    ])->assertCreated();
});
