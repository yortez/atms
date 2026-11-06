<?php

use App\Models\AcademicProgram;
use App\Models\ActivityLog;
use App\Models\AlumniProfile;
use App\Models\Announcement;
use App\Models\Degree;
use App\Models\Department;
use App\Models\ProgramDegree;
use App\Models\Role;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;

function createAnnouncementRoleUser(string $roleName, ?int $alumniProfileId = null): User
{
    $role = Role::firstOrCreate(['name' => $roleName], ['label' => ucfirst($roleName)]);
    $user = User::factory()->create([
        'email_verified_at' => now(),
        'alumni_profile_id' => $alumniProfileId,
    ]);
    $user->roles()->syncWithoutDetaching([$role->id]);

    return $user;
}

it('allows coordinators to create, edit, pin, unpublish, and delete announcements with audit logs and notifications', function () {
    $coordinator = createAnnouncementRoleUser('alumni-coordinator');
    $alumniUser = createAnnouncementRoleUser('alumni');

    Sanctum::actingAs($coordinator, ['api']);

    // 1. Create & Publish Immediately with category, pin, CTA, and notification broadcast
    $storeRes = $this->postJson('/api/announcements', [
        'title' => 'Grand Homecoming 2026',
        'body' => 'Join us at the Northfield Grand Hall.',
        'category' => 'event',
        'is_pinned' => true,
        'is_public' => true,
        'action_label' => 'Register Now',
        'action_url' => 'https://example.edu/homecoming',
        'audience_roles' => ['alumni'],
        'publish_now' => true,
        'notify_audience' => true,
    ])->assertCreated();

    $announcementId = $storeRes->json('data.id');
    expect($storeRes->json('data.status'))->toBe('published')
        ->and($storeRes->json('data.category'))->toBe('event')
        ->and($storeRes->json('data.is_pinned'))->toBeTrue()
        ->and($storeRes->json('data.action_label'))->toBe('Register Now');

    // Verify in-app notification was sent to targeted alumni user
    expect($alumniUser->notifications()->count())->toBe(1);

    // 2. Edit announcement & toggle pin
    $this->patchJson("/api/announcements/{$announcementId}", [
        'title' => 'Updated Grand Homecoming 2026',
        'is_pinned' => false,
        'is_public' => false,
    ])->assertOk()
        ->assertJsonPath('data.title', 'Updated Grand Homecoming 2026')
        ->assertJsonPath('data.is_pinned', false)
        ->assertJsonPath('data.is_public', false);

    // 3. Unpublish back to draft
    $this->postJson("/api/announcements/{$announcementId}/unpublish", [
        'status' => 'draft',
    ])->assertOk()
        ->assertJsonPath('data.status', 'draft');

    // 4. Delete announcement
    $this->deleteJson("/api/announcements/{$announcementId}")
        ->assertOk();

    expect(Announcement::find($announcementId))->toBeNull();
    expect(ActivityLog::where('action', 'announcement.deleted')->exists())->toBeTrue();
});

it('filters cohort-targeted announcements by department, program, and graduation year for alumni', function () {
    $admin = createAnnouncementRoleUser('system-administrator');

    $ccs = Department::create(['code' => 'CCS', 'name' => 'College of Computing Studies', 'is_active' => true]);
    $cba = Department::create(['code' => 'CBA', 'name' => 'College of Business Administration', 'is_active' => true]);

    $bscs = AcademicProgram::create(['department_id' => $ccs->id, 'code' => 'BSCS', 'name' => 'BS Computer Science', 'is_active' => true]);
    $bsba = AcademicProgram::create(['department_id' => $cba->id, 'code' => 'BSBA', 'name' => 'BS Business Admin', 'is_active' => true]);

    $degCs = Degree::create(['code' => 'BSCS', 'title' => 'BS in Computer Science', 'degree_level' => 'bachelor', 'is_active' => true]);
    $degBa = Degree::create(['code' => 'BSBA', 'title' => 'BS in Business Administration', 'degree_level' => 'bachelor', 'is_active' => true]);

    $pdCs = ProgramDegree::create(['program_id' => $bscs->id, 'degree_id' => $degCs->id, 'is_active' => true]);
    $pdBa = ProgramDegree::create(['program_id' => $bsba->id, 'degree_id' => $degBa->id, 'is_active' => true]);

    $csProfile = AlumniProfile::create([
        'name' => 'CS Grad 2024',
        'email' => 'cs2024@atms.test',
        'date_of_birth' => '2002-05-10',
        'profile_status' => 'active',
    ]);
    DB::table('alumni_education_records')->insert([
        'alumni_profile_id' => $csProfile->id,
        'student_number' => '2020-9001',
        'program_degree_id' => $pdCs->id,
        'graduation_year' => 2024,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $baProfile = AlumniProfile::create([
        'name' => 'BA Grad 2023',
        'email' => 'ba2023@atms.test',
        'date_of_birth' => '2001-04-12',
        'profile_status' => 'active',
    ]);
    DB::table('alumni_education_records')->insert([
        'alumni_profile_id' => $baProfile->id,
        'student_number' => '2019-9002',
        'program_degree_id' => $pdBa->id,
        'graduation_year' => 2023,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $csUser = createAnnouncementRoleUser('alumni', $csProfile->id);
    $baUser = createAnnouncementRoleUser('alumni', $baProfile->id);

    Sanctum::actingAs($admin, ['api']);

    // Create a CCS Batch 2024 targeted announcement
    $this->postJson('/api/announcements', [
        'title' => 'CCS Batch 2024 Accreditation Briefing',
        'body' => 'Special briefing for BSCS 2024 graduates.',
        'category' => 'tracer',
        'audience_roles' => ['alumni'],
        'target_department_ids' => [$ccs->id],
        'target_graduation_years' => [2024],
        'publish_now' => true,
    ])->assertCreated();

    // CS 2024 alumnus should see it
    Sanctum::actingAs($csUser, ['api']);
    $csList = $this->getJson('/api/announcements')->assertOk()->json('data.data');
    expect(collect($csList)->pluck('title'))->toContain('CCS Batch 2024 Accreditation Briefing');

    // BA 2023 alumnus should NOT see it
    Sanctum::actingAs($baUser, ['api']);
    $baList = $this->getJson('/api/announcements')->assertOk()->json('data.data');
    expect(collect($baList)->pluck('title'))->not->toContain('CCS Batch 2024 Accreditation Briefing');
});
