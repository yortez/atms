<?php

use App\Models\AcademicProgram;
use App\Models\AlumniDocument;
use App\Models\AlumniEmploymentRecord;
use App\Models\AlumniProfile;
use App\Models\AlumniRegistrationAssistanceRequest;
use App\Models\Degree;
use App\Models\Department;
use App\Models\Employer;
use App\Models\EmploymentStatus;
use App\Models\ProgramDegree;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;

/**
 * @return array{department: Department, program: AcademicProgram, offering: ProgramDegree}
 */
function createAcademicOffering(string $code = 'IT'): array
{
    $department = Department::create(['code' => "D-{$code}", 'name' => "{$code} Department"]);
    $program = $department->programs()->create(['code' => $code, 'name' => "{$code} Program"]);
    $degree = Degree::create(['code' => "BS-{$code}", 'title' => "BS {$code}", 'degree_level' => 'undergraduate']);
    $offering = ProgramDegree::create([
        'program_id' => $program->id,
        'degree_id' => $degree->id,
    ]);

    return compact('department', 'program', 'offering');
}

function assignRole(User $user, string $name): void
{
    $role = Role::query()->firstOrCreate(['name' => $name], ['label' => str($name)->headline()]);
    $user->roles()->attach($role->id, ['created_at' => now()]);
}

test('alumni APIs require an authenticated session', function () {
    $this->getJson('/api/alumni')->assertUnauthorized();
});

test('department coordinators need an update permission to edit alumni records', function () {
    $offering = createAcademicOffering('IT');
    $user = User::factory()->create();
    assignRole($user, 'department-coordinator');
    $user->assignedPrograms()->attach($offering['program']->id, ['created_at' => now()]);

    $profile = AlumniProfile::create([
        'name' => 'Assigned Alumni',
        'email' => 'assigned@example.com',
        'date_of_birth' => '1990-01-01',
    ]);
    $profile->educationRecords()->create([
        'student_number' => '2020-00103',
        'program_degree_id' => $offering['offering']->id,
        'graduation_year' => 2020,
    ]);

    $this->actingAs($user)->patchJson("/api/alumni/{$profile->id}", [
        'preferred_name' => 'Updated',
    ])->assertForbidden();
});

test('department coordinators only list alumni from assigned academic programs', function () {
    $assigned = createAcademicOffering('IT');
    $unassigned = createAcademicOffering('BA');
    $user = User::factory()->create();
    assignRole($user, 'department-coordinator');
    $user->assignedPrograms()->attach($assigned['program']->id, ['created_at' => now()]);

    $visible = AlumniProfile::create([
        'name' => 'Visible Alumni',
        'email' => 'visible@example.com',
        'date_of_birth' => '1990-01-01',
        'first_name' => 'Visible',
        'last_name' => 'Alumni',
    ]);
    $hidden = AlumniProfile::create([
        'name' => 'Hidden Alumni',
        'email' => 'hidden@example.com',
        'date_of_birth' => '1990-01-01',
        'first_name' => 'Hidden',
        'last_name' => 'Alumni',
    ]);
    $visible->educationRecords()->create([
        'student_number' => '2020-00101',
        'program_degree_id' => $assigned['offering']->id,
        'graduation_year' => 2020,
    ]);
    $hidden->educationRecords()->create([
        'student_number' => '2020-00102',
        'program_degree_id' => $unassigned['offering']->id,
        'graduation_year' => 2020,
    ]);

    $this->actingAs($user)->getJson('/api/alumni')->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.id', $visible->id);

    $this->actingAs($user)->getJson("/api/alumni/{$hidden->id}")->assertForbidden();
});

test('alumni can report employment and the previous current period is retained', function () {
    $user = User::factory()->create();
    $profile = AlumniProfile::create([
        'name' => 'Tracer Alumni',
        'email' => 'tracer@example.com',
        'date_of_birth' => '1990-01-01',
        'gender' => 'Male',
        'civil_status' => 'Single',
        'contact_number' => '+63 912 345 6789',
        'current_address' => 'Bacolod City, Negros Occidental',
        'permanent_address' => 'Bacolod City, Negros Occidental',
    ]);
    $user->alumniProfile()->associate($profile);
    $user->save();
    $status = EmploymentStatus::create(['code' => 'employed', 'label' => 'Employed']);

    $this->actingAs($user)->postJson("/api/alumni/{$profile->id}/employment", [
        'employment_status_id' => $status->id,
        'employer_name' => 'First Employer',
        'started_on' => '2024-01-01',
    ])->assertCreated();

    $this->actingAs($user)->postJson("/api/alumni/{$profile->id}/employment", [
        'employment_status_id' => $status->id,
        'employer_name' => 'Second Employer',
        'started_on' => '2025-03-01',
    ])->assertCreated();

    expect(AlumniEmploymentRecord::query()->where('alumni_id', $profile->id)->orderBy('id')->pluck('ended_on')->map(
        fn ($date) => $date?->toDateString(),
    )->all())->toBe(['2025-02-28', null]);
    $this->assertDatabaseHas('activity_logs', ['action' => 'alumni.employment_reported']);
    $this->assertDatabaseHas('notifications', ['notifiable_id' => $user->id]);
});

test('employment periods reject an end date earlier than the start date', function () {
    $user = User::factory()->create();
    $profile = AlumniProfile::create([
        'name' => 'Tracer Alumni',
        'email' => 'tracer@example.com',
        'date_of_birth' => '1990-01-01',
        'gender' => 'Male',
        'civil_status' => 'Single',
        'contact_number' => '+63 912 345 6789',
        'current_address' => 'Bacolod City, Negros Occidental',
        'permanent_address' => 'Bacolod City, Negros Occidental',
    ]);
    $user->alumniProfile()->associate($profile);
    $user->save();
    $status = EmploymentStatus::create(['code' => 'unemployed', 'label' => 'Unemployed']);

    $this->actingAs($user)->postJson("/api/alumni/{$profile->id}/employment", [
        'employment_status_id' => $status->id,
        'started_on' => '2025-03-01',
        'ended_on' => '2025-02-01',
    ])->assertUnprocessable()
        ->assertJsonValidationErrors('ended_on');
});

test('alumni documents are private and only the owner can download them', function () {
    Storage::fake('local');
    $user = User::factory()->create();
    $profile = AlumniProfile::create([
        'name' => 'Document Owner',
        'email' => 'owner@example.com',
        'date_of_birth' => '1990-01-01',
    ]);
    $user->alumniProfile()->associate($profile);
    $user->save();

    $upload = $this->actingAs($user)->postJson("/api/alumni/{$profile->id}/documents", [
        'document_type' => 'resume',
        'file' => UploadedFile::fake()->createWithContent('resume.pdf', '%PDF-1.4 test document'),
    ])->assertCreated();
    $documentId = $upload->json('data.id');
    $document = AlumniDocument::findOrFail($documentId);

    $this->get("/api/alumni-documents/{$documentId}")->assertOk();
    Storage::disk('local')->assertExists($document->path);

    $otherUser = User::factory()->create();
    Sanctum::actingAs($otherUser, ['api']);
    $this->getJson("/api/alumni-documents/{$documentId}")->assertForbidden();
});

test('assistance requests are restricted to coordinators and can be reviewed', function () {
    $user = User::factory()->create();
    assignRole($user, 'alumni-coordinator');
    $assistanceRequest = AlumniRegistrationAssistanceRequest::create([
        'name' => 'Applicant',
        'email' => 'applicant@example.com',
        'date_of_birth' => '1990-01-01',
        'student_number' => 'UNKNOWN-001',
    ]);

    $this->actingAs($user)->patchJson("/api/registration-assistance/{$assistanceRequest->id}", [
        'status' => 'reviewed',
        'review_note' => 'Roster corrected; applicant may register.',
    ])->assertOk()->assertJsonPath('data.status', 'reviewed');

    expect($assistanceRequest->fresh()->reviewed_by_user_id)->toBe($user->id);
    expect($assistanceRequest->fresh()->review_note)->toBe('Roster corrected; applicant may register.');
});

test('employer registration starts pending and verification is staff controlled', function () {
    $owner = User::factory()->create();

    $response = $this->actingAs($owner)->postJson('/api/employers', [
        'company_name' => 'Northstar Digital',
        'contact_email' => 'hr@northstar.example',
        'website' => 'https://northstar.example',
    ])->assertCreated();
    $employerId = $response->json('data.id');
    $employer = Employer::findOrFail($employerId);

    expect($employer->verification_status)->toBe('pending');
    expect($owner->fresh()->hasRole('employer'))->toBeTrue();
    expect($employer->users()->whereKey($owner->id)->exists())->toBeTrue();
    Sanctum::actingAs($owner, ['api']);
    $this->getJson("/api/employers/{$employerId}")
        ->assertOk()
        ->assertJsonMissingPath('data.users.0.email');

    $reviewer = User::factory()->create();
    assignRole($reviewer, 'alumni-coordinator');
    Sanctum::actingAs($reviewer, ['api']);
    $this->patchJson("/api/employers/{$employerId}/verification", [
        'verification_status' => 'verified',
    ])->assertOk()->assertJsonPath('data.verification_status', 'verified');
    $this->assertDatabaseHas('notifications', ['notifiable_id' => $owner->id]);
});

test('employment outcome reports apply program scope and use current status', function () {
    $offering = createAcademicOffering('IS');
    $profile = AlumniProfile::create([
        'name' => 'Reported Alumni',
        'email' => 'reported@example.com',
        'date_of_birth' => '1990-01-01',
    ]);
    $profile->educationRecords()->create([
        'student_number' => '2019-00101',
        'program_degree_id' => $offering['offering']->id,
        'graduation_year' => 2019,
    ]);
    $employed = EmploymentStatus::create(['code' => 'employed', 'label' => 'Employed']);
    $furtherStudies = EmploymentStatus::create(['code' => 'further-studies', 'label' => 'Further Studies']);
    $profile->employmentRecords()->create([
        'employment_status_id' => $employed->id,
        'employer_name' => 'Old Employer',
        'started_on' => '2023-01-01',
        'ended_on' => '2024-01-01',
        'reported_at' => '2024-01-01 00:00:00',
    ]);
    $profile->employmentRecords()->create([
        'employment_status_id' => $furtherStudies->id,
        'started_on' => '2024-01-02',
        'reported_at' => '2024-01-02 00:00:00',
    ]);

    $coordinator = User::factory()->create();
    assignRole($coordinator, 'department-coordinator');
    $coordinator->assignedPrograms()->attach($offering['program']->id, ['created_at' => now()]);

    $this->actingAs($coordinator)->getJson('/api/reports/employment-outcomes')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.status', 'Further Studies')
        ->assertJsonPath('data.0.alumni_count', 1);
});

test('administrators can create and update departments, academic programs, and degree offerings', function () {
    $admin = User::factory()->create();
    assignRole($admin, 'system-administrator');
    Sanctum::actingAs($admin, ['api']);

    // 1. Create Department
    $deptRes = $this->postJson('/api/departments', [
        'code' => 'coe',
        'name' => 'College of Engineering',
        'description' => 'Engineering programs and research.',
    ])->assertCreated()
        ->assertJsonPath('data.code', 'COE')
        ->assertJsonPath('data.name', 'College of Engineering');

    $deptId = $deptRes->json('data.id');

    // 2. Update Department
    $this->patchJson("/api/departments/{$deptId}", [
        'name' => 'College of Engineering & Architecture',
    ])->assertOk()
        ->assertJsonPath('data.name', 'College of Engineering & Architecture');

    // 3. Create Program with initial degree offering
    $progRes = $this->postJson("/api/departments/{$deptId}/programs", [
        'code' => 'bsce',
        'name' => 'BS in Civil Engineering',
        'degree_title' => 'Bachelor of Science in Civil Engineering',
    ])->assertCreated()
        ->assertJsonPath('data.code', 'BSCE')
        ->assertJsonCount(1, 'data.program_degrees');

    $progId = $progRes->json('data.id');

    // 4. Update Program
    $this->patchJson("/api/programs/{$progId}", [
        'name' => 'Bachelor of Science in Civil Engineering (Honors)',
    ])->assertOk()
        ->assertJsonPath('data.name', 'Bachelor of Science in Civil Engineering (Honors)');

    // 5. Add another degree offering inline
    $this->postJson("/api/programs/{$progId}/degrees", [
        'degree_title' => 'Master of Science in Structural Engineering',
    ])->assertCreated()
        ->assertJsonPath('data.degree.title', 'Master of Science in Structural Engineering');
});

test('administrators can upload, replace, and remove a department logo', function () {
    Storage::fake('public');

    $admin = User::factory()->create();
    assignRole($admin, 'system-administrator');
    Sanctum::actingAs($admin, ['api']);

    $makePng = fn (string $name): UploadedFile => function_exists('imagecreatetruecolor')
        ? UploadedFile::fake()->image($name)
        : UploadedFile::fake()->createWithContent(
            $name,
            base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', true) ?: '',
        );

    // 1. Reject non-image uploads
    $this->post('/api/departments', [
        'code' => 'ccs',
        'name' => 'College of Computing Studies',
        'logo' => UploadedFile::fake()->create('logo.pdf', 100, 'application/pdf'),
    ], ['Accept' => 'application/json'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('logo');

    // 2. Create department with logo
    $createRes = $this->post('/api/departments', [
        'code' => 'ccs',
        'name' => 'College of Computing Studies',
        'logo' => $makePng('ccs-logo.png'),
    ], ['Accept' => 'application/json'])->assertCreated();

    $department = Department::query()->findOrFail($createRes->json('data.id'));
    $firstLogoPath = $department->logo_path;

    expect($firstLogoPath)->not->toBeNull()
        ->and($firstLogoPath)->toStartWith('department-logos/')
        ->and($createRes->json('data.logo'))->toBe(Storage::disk('public')->url($firstLogoPath))
        ->and($createRes->json('data.logo_path'))->toBeNull();
    Storage::disk('public')->assertExists($firstLogoPath);

    // 3. Replace department logo via POST + _method=PATCH
    $updateRes = $this->post("/api/departments/{$department->id}", [
        '_method' => 'PATCH',
        'name' => 'College of Computing & Information Studies',
        'logo' => $makePng('ccs-logo-v2.png'),
    ], ['Accept' => 'application/json'])
        ->assertOk()
        ->assertJsonPath('data.name', 'College of Computing & Information Studies');

    $department->refresh();
    $secondLogoPath = $department->logo_path;

    expect($secondLogoPath)->not->toBeNull()
        ->and($secondLogoPath)->not->toBe($firstLogoPath)
        ->and($updateRes->json('data.logo'))->toBe(Storage::disk('public')->url($secondLogoPath));
    Storage::disk('public')->assertMissing($firstLogoPath);
    Storage::disk('public')->assertExists($secondLogoPath);

    // 4. Remove department logo
    $removeRes = $this->post("/api/departments/{$department->id}", [
        '_method' => 'PATCH',
        'remove_logo' => '1',
    ], ['Accept' => 'application/json'])
        ->assertOk();

    $department->refresh();
    expect($department->logo_path)->toBeNull()
        ->and($removeRes->json('data.logo'))->toBeNull();
    Storage::disk('public')->assertMissing($secondLogoPath);
});
