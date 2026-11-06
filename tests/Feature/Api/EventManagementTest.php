<?php

use App\Models\AcademicProgram;
use App\Models\AlumniEvent;
use App\Models\AlumniProfile;
use App\Models\Degree;
use App\Models\Department;
use App\Models\ProgramDegree;
use App\Models\Role;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;

function createEventRoleUser(string $roleName, ?int $alumniProfileId = null): User
{
    $role = Role::firstOrCreate(['name' => $roleName], ['label' => ucfirst($roleName)]);
    $user = User::factory()->create([
        'email_verified_at' => now(),
        'alumni_profile_id' => $alumniProfileId,
    ]);
    $user->roles()->syncWithoutDetaching([$role->id]);

    return $user;
}

it('allows coordinators to create, publish, feature, manage attendees, and enforce RSVP capacity on events', function () {
    $coordinator = createEventRoleUser('alumni-coordinator');
    $alumnusOne = createEventRoleUser('alumni');
    $alumnusTwo = createEventRoleUser('alumni');

    Sanctum::actingAs($coordinator, ['api']);

    // 1. Create & Publish an event with capacity = 1
    $storeRes = $this->postJson('/api/events', [
        'title' => 'Northfield Tech Alumni Mixer 2026',
        'description' => 'Evening networking session with industry mentors.',
        'event_type' => 'networking',
        'format' => 'hybrid',
        'venue' => 'Northfield Innovation Hub',
        'meeting_url' => 'https://meet.example.edu/mixer',
        'starts_at' => now()->addDays(14)->toISOString(),
        'ends_at' => now()->addDays(14)->addHours(3)->toISOString(),
        'capacity' => 1,
        'is_featured' => true,
        'is_public' => true,
        'audience_roles' => ['alumni'],
        'publish_now' => true,
        'notify_audience' => true,
    ])->assertCreated();

    $eventId = $storeRes->json('data.id');
    expect($storeRes->json('data.status'))->toBe('published')
        ->and($storeRes->json('data.event_type'))->toBe('networking')
        ->and($storeRes->json('data.is_featured'))->toBeTrue();

    // Verify in-app notification was sent to alumni
    expect($alumnusOne->notifications()->count())->toBe(1);

    // 2. Alumnus One RSVPs as Going
    Sanctum::actingAs($alumnusOne, ['api']);
    $rsvpRes = $this->postJson("/api/events/{$eventId}/rsvp", [
        'status' => 'going',
    ])->assertOk();

    expect($rsvpRes->json('data.going_count'))->toBe(1)
        ->and($rsvpRes->json('data.my_registration_status'))->toBe('going');

    // 3. Alumnus Two tries to RSVP Going when capacity (1) is full -> 422
    Sanctum::actingAs($alumnusTwo, ['api']);
    $this->postJson("/api/events/{$eventId}/rsvp", [
        'status' => 'going',
    ])->assertStatus(422);

    // Alumnus Two can still mark as Interested
    $this->postJson("/api/events/{$eventId}/rsvp", [
        'status' => 'interested',
    ])->assertOk()
        ->assertJsonPath('data.interested_count', 1)
        ->assertJsonPath('data.my_registration_status', 'interested');

    // 4. Coordinator inspects attendee roster
    Sanctum::actingAs($coordinator, ['api']);
    $attendees = $this->getJson("/api/events/{$eventId}/attendees")
        ->assertOk()
        ->json('data');

    expect($attendees)->toHaveCount(2);

    // 5. Coordinator deletes event
    $this->deleteJson("/api/events/{$eventId}")->assertOk();
    expect(AlumniEvent::find($eventId))->toBeNull();
});

it('filters cohort-targeted events by department and graduation year for alumni', function () {
    $admin = createEventRoleUser('system-administrator');

    $ccs = Department::create(['code' => 'CCS', 'name' => 'College of Computing Studies', 'is_active' => true]);
    $cba = Department::create(['code' => 'CBA', 'name' => 'College of Business Administration', 'is_active' => true]);

    $bscs = AcademicProgram::create(['department_id' => $ccs->id, 'code' => 'BSCS', 'name' => 'BS Computer Science', 'is_active' => true]);
    $bsba = AcademicProgram::create(['department_id' => $cba->id, 'code' => 'BSBA', 'name' => 'BS Business Admin', 'is_active' => true]);

    $degCs = Degree::create(['code' => 'BSCS', 'title' => 'BS in Computer Science', 'degree_level' => 'bachelor', 'is_active' => true]);
    $degBa = Degree::create(['code' => 'BSBA', 'title' => 'BS in Business Administration', 'degree_level' => 'bachelor', 'is_active' => true]);

    $pdCs = ProgramDegree::create(['program_id' => $bscs->id, 'degree_id' => $degCs->id, 'is_active' => true]);
    $pdBa = ProgramDegree::create(['program_id' => $bsba->id, 'degree_id' => $degBa->id, 'is_active' => true]);

    $csProfile = AlumniProfile::create([
        'name' => 'CS Alumni 2021',
        'email' => 'cs2021@atms.test',
        'date_of_birth' => '1999-05-10',
        'profile_status' => 'active',
    ]);
    DB::table('alumni_education_records')->insert([
        'alumni_profile_id' => $csProfile->id,
        'student_number' => '2017-5001',
        'program_degree_id' => $pdCs->id,
        'graduation_year' => 2021,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $baProfile = AlumniProfile::create([
        'name' => 'BA Alumni 2023',
        'email' => 'ba2023-ev@atms.test',
        'date_of_birth' => '2001-04-12',
        'profile_status' => 'active',
    ]);
    DB::table('alumni_education_records')->insert([
        'alumni_profile_id' => $baProfile->id,
        'student_number' => '2019-5002',
        'program_degree_id' => $pdBa->id,
        'graduation_year' => 2023,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $csUser = createEventRoleUser('alumni', $csProfile->id);
    $baUser = createEventRoleUser('alumni', $baProfile->id);

    Sanctum::actingAs($admin, ['api']);

    $this->postJson('/api/events', [
        'title' => 'CCS Class of 2021 5-Year Reunion',
        'description' => 'Exclusive 5-year reunion dinner for CCS Batch 2021.',
        'event_type' => 'reunion',
        'format' => 'in_person',
        'venue' => 'Northfield Alumni Hall',
        'starts_at' => now()->addDays(30)->toISOString(),
        'audience_roles' => ['alumni'],
        'target_department_ids' => [$ccs->id],
        'target_graduation_years' => [2021],
        'publish_now' => true,
    ])->assertCreated();

    Sanctum::actingAs($csUser, ['api']);
    $csEvents = $this->getJson('/api/events')->assertOk()->json('data.data');
    expect(collect($csEvents)->pluck('title'))->toContain('CCS Class of 2021 5-Year Reunion');

    Sanctum::actingAs($baUser, ['api']);
    $baEvents = $this->getJson('/api/events')->assertOk()->json('data.data');
    expect(collect($baEvents)->pluck('title'))->not->toContain('CCS Class of 2021 5-Year Reunion');
});

