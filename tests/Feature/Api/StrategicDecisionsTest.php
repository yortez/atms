<?php

use App\Models\AcademicProgram;
use App\Models\AlumniEducationRecord;
use App\Models\AlumniEmploymentRecord;
use App\Models\AlumniProfile;
use App\Models\AlumniRegistrationAssistanceRequest;
use App\Models\Degree;
use App\Models\Department;
use App\Models\Employer;
use App\Models\EmploymentStatus;
use App\Models\JobApplication;
use App\Models\JobPosting;
use App\Models\ProgramDegree;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;

function createCatalogProgram(string $code, string $name): array
{
    $department = Department::create(['code' => $code . '_DEPT', 'name' => $name . ' Dept']);
    $program = AcademicProgram::create(['department_id' => $department->id, 'code' => $code, 'name' => $name]);
    $degree = Degree::create(['code' => $code . '_DEG', 'title' => $name . ' Degree', 'degree_level' => 'bachelor']);
    $programDegree = ProgramDegree::create(['program_id' => $program->id, 'degree_id' => $degree->id]);

    return [$department, $program, $programDegree];
}

test('department coordinators only see education records within their assigned programs (Option A)', function () {
    [$deptIT, $progIT, $degreeIT] = createCatalogProgram('BSIT', 'BS Information Technology');
    [$deptBA, $progBA, $degreeBA] = createCatalogProgram('BSBA', 'BS Business Administration');

    // Create an alumnus with two degrees
    $profile = AlumniProfile::create([
        'name' => 'Jane Smith',
        'first_name' => 'Jane',
        'last_name' => 'Smith',
        'email' => 'jane@example.com',
        'date_of_birth' => '1995-05-15',
    ]);

    AlumniEducationRecord::create([
        'alumni_profile_id' => $profile->id,
        'student_number' => 'IT-2020-001',
        'program_degree_id' => $degreeIT->id,
        'graduation_year' => 2020,
    ]);

    AlumniEducationRecord::create([
        'alumni_profile_id' => $profile->id,
        'student_number' => 'BA-2024-002',
        'program_degree_id' => $degreeBA->id,
        'graduation_year' => 2024,
    ]);

    // Create Dept Coordinator assigned ONLY to BSIT
    $deptCoord = User::factory()->create();
    $deptRole = Role::firstOrCreate(['name' => 'department-coordinator'], ['label' => 'Department Coordinator']);
    $deptCoord->roles()->syncWithoutDetaching([$deptRole->id => ['created_at' => now()]]);
    $deptCoord->assignedPrograms()->sync([$progIT->id => ['created_at' => now()]]);

    Sanctum::actingAs($deptCoord, ['api']);

    $response = $this->getJson("/api/alumni/{$profile->id}")->assertOk();

    // Option A: Education records must only include BSIT
    $educationRecords = $response->json('data.education_records');
    expect($educationRecords)->toHaveCount(1);
    expect($educationRecords[0]['student_number'])->toBe('IT-2020-001');
    expect($educationRecords[0]['program'])->toBe('BS Information Technology');

    // System Administrator must see both records
    $admin = User::factory()->create();
    $adminRole = Role::firstOrCreate(['name' => 'system-administrator'], ['label' => 'System Administrator']);
    $admin->roles()->syncWithoutDetaching([$adminRole->id => ['created_at' => now()]]);

    Sanctum::actingAs($admin, ['api']);
    $adminResponse = $this->getJson("/api/alumni/{$profile->id}")->assertOk();
    expect($adminResponse->json('data.education_records'))->toHaveCount(2);
});

test('claiming an alumni record requires student number, last name, and date of birth', function () {
    [$dept, $prog, $progDegree] = createCatalogProgram('BSCS', 'BS Computer Science');

    $profile = AlumniProfile::create([
        'name' => 'Alice Wonder',
        'first_name' => 'Alice',
        'last_name' => 'Wonder',
        'email' => 'old_dorm_email@alumni.local', // Roster email
        'date_of_birth' => '1998-03-25',
    ]);

    AlumniEducationRecord::create([
        'alumni_profile_id' => $profile->id,
        'student_number' => 'CS-1998-001',
        'program_degree_id' => $progDegree->id,
        'graduation_year' => 2020,
    ]);

    // Register with a NEW modern personal email, matching Student Number + Last Name + Date of Birth
    $response = $this->post(route('register.store'), [
        'name' => 'Alice Wonder',
        'last_name' => 'Wonder',
        'email' => 'alice.new.personal@gmail.com',
        'student_number' => 'CS-1998-001',
        'date_of_birth' => '1998-03-25',
        'password' => 'SecurePass123!',
        'password_confirmation' => 'SecurePass123!',
    ]);

    $response->assertRedirect(route('dashboard', absolute: false));
    $this->assertAuthenticated();

    $user = auth()->user();
    expect($user->email)->toBe('alice.new.personal@gmail.com');
    expect($user->alumni_profile_id)->toBe($profile->id);
    expect($user->hasRole('alumni'))->toBeTrue();
});

test('registration credential mismatch automatically files an assistance request reviewable by department coordinator', function () {
    [$dept, $prog, $progDegree] = createCatalogProgram('BSEE', 'BS Electrical Engineering');

    $profile = AlumniProfile::create([
        'name' => 'Bob Marley',
        'first_name' => 'Bob',
        'last_name' => 'Marley',
        'email' => 'bob@example.com',
        'date_of_birth' => '1992-02-06',
    ]);

    AlumniEducationRecord::create([
        'alumni_profile_id' => $profile->id,
        'student_number' => 'EE-1992-099',
        'program_degree_id' => $progDegree->id,
        'graduation_year' => 2014,
    ]);

    // Attempt registration with wrong DOB
    $this->from(route('register'))->post(route('register.store'), [
        'name' => 'Bob Marley',
        'last_name' => 'Marley',
        'email' => 'bob.attempt@example.com',
        'student_number' => 'EE-1992-099',
        'date_of_birth' => '1995-12-12', // Wrong DOB!
        'password' => 'SecurePass123!',
        'password_confirmation' => 'SecurePass123!',
    ])->assertRedirect(route('register'))->assertSessionHasErrors('student_number');

    // Assistance request was created and associated with BSEE program
    $assistanceRequest = AlumniRegistrationAssistanceRequest::query()
        ->where('student_number', 'EE-1992-099')
        ->first();

    expect($assistanceRequest)->not->toBeNull();
    expect($assistanceRequest->academic_program_id)->toBe($prog->id);
    expect($assistanceRequest->status)->toBe('pending');

    // Department Coordinator for BSEE can list and review it
    $deptCoord = User::factory()->create();
    $deptRole = Role::firstOrCreate(['name' => 'department-coordinator'], ['label' => 'Department Coordinator']);
    $deptCoord->roles()->syncWithoutDetaching([$deptRole->id => ['created_at' => now()]]);
    $deptCoord->assignedPrograms()->sync([$prog->id => ['created_at' => now()]]);

    Sanctum::actingAs($deptCoord, ['api']);

    $indexRes = $this->getJson('/api/registration-assistance')->assertOk();
    $items = collect($indexRes->json('data.data'));
    expect($items->pluck('id'))->toContain($assistanceRequest->id);

    // Review/approve assistance request
    $this->patchJson("/api/registration-assistance/{$assistanceRequest->id}", [
        'status' => 'reviewed',
        'review_note' => 'DOB record confirmed with registrar.',
    ])->assertOk();

    expect($assistanceRequest->fresh()->status)->toBe('reviewed');
    expect($assistanceRequest->fresh()->reviewed_by_user_id)->toBe($deptCoord->id);
});

test('job application stores a frozen profile snapshot and submitted resume', function () {
    Storage::fake('local');

    [$dept, $prog, $progDegree] = createCatalogProgram('BSCS', 'BS Computer Science');

    $employerUser = User::factory()->create();
    $employerRole = Role::firstOrCreate(['name' => 'employer'], ['label' => 'Employer']);
    $employerUser->roles()->syncWithoutDetaching([$employerRole->id => ['created_at' => now()]]);

    $employer = Employer::create([
        'company_name' => 'Tech Corp',
        'contact_email' => 'jobs@techcorp.example',
        'verification_status' => 'verified',
    ]);
    $employer->users()->attach($employerUser->id, ['membership_role' => 'owner', 'created_at' => now()]);

    $jobPosting = JobPosting::create([
        'employer_id' => $employer->id,
        'title' => 'Junior Web Developer',
        'description' => 'Great role for fresh graduates.',
        'status' => 'published',
        'published_at' => now(),
    ]);

    // Create an alumnus applicant
    $profile = AlumniProfile::create([
        'name' => 'Charlie Day',
        'first_name' => 'Charlie',
        'last_name' => 'Day',
        'email' => 'charlie@example.com',
        'date_of_birth' => '1996-08-08',
        'gender' => 'Male',
        'civil_status' => 'Single',
        'contact_number' => '+63 912 345 6789',
        'current_address' => 'Bacolod City, Negros Occidental',
        'permanent_address' => 'Bacolod City, Negros Occidental',
    ]);

    AlumniEducationRecord::create([
        'alumni_profile_id' => $profile->id,
        'student_number' => 'CS-2018-050',
        'program_degree_id' => $progDegree->id,
        'graduation_year' => 2020,
        'honors' => 'Cum Laude',
        'gwa' => 1.45,
    ]);

    $status = EmploymentStatus::firstOrCreate(['code' => 'employed', 'label' => 'Employed', 'is_active' => true]);
    AlumniEmploymentRecord::create([
        'alumni_id' => $profile->id,
        'employment_status_id' => $status->id,
        'employer_name' => 'Initial Startup',
        'job_title' => 'Intern',
        'is_related_to_degree' => true,
        'started_on' => '2021-01-01',
        'reported_at' => now(),
    ]);

    $alumniUser = User::factory()->create(['alumni_profile_id' => $profile->id]);
    $alumniRole = Role::firstOrCreate(['name' => 'alumni'], ['label' => 'Alumni']);
    $alumniUser->roles()->syncWithoutDetaching([$alumniRole->id => ['created_at' => now()]]);

    Sanctum::actingAs($alumniUser, ['api']);

    $resumeFile = UploadedFile::fake()->create('my_resume.pdf', 200, 'application/pdf');

    $applyRes = $this->postJson("/api/jobs/{$jobPosting->id}/applications", [
        'cover_letter' => 'I would love to work with Tech Corp.',
        'resume' => $resumeFile,
    ])->assertCreated();

    $appId = $applyRes->json('data.id');
    $application = JobApplication::find($appId);

    expect($application->profile_snapshot)->toBeArray();
    expect($application->profile_snapshot['name'])->toBe('Charlie Day');
    expect($application->profile_snapshot['education'][0]['honors'])->toBe('Cum Laude');
    expect((float) $application->profile_snapshot['education'][0]['gwa'])->toBe(1.45);
    expect($application->profile_snapshot['employment'][0]['job_title'])->toBe('Intern');
    expect($application->profile_snapshot['employment'][0]['is_related_to_degree'])->toBeTrue();
    expect($application->resume_snapshot_path)->not->toBeNull();

    // Verify snapshot immutability: alumnus alters their live profile later
    $profile->update(['name' => 'Charlie Altered Name']);
    expect($application->fresh()->profile_snapshot['name'])->toBe('Charlie Day');

    // Employer can list applicants and see snapshot
    Sanctum::actingAs($employerUser, ['api']);
    $employerList = $this->getJson("/api/employer/jobs/{$jobPosting->id}/applications")->assertOk();
    $applicantData = $employerList->json('data.data.0');
    expect($applicantData['profile_snapshot']['name'])->toBe('Charlie Day');

    // Employer can download resume snapshot
    $downloadRes = $this->get("/api/applications/{$application->id}/resume");
    $downloadRes->assertOk();
});

test('employment tracer records degree relevance flag (Option B)', function () {
    $profile = AlumniProfile::create([
        'name' => 'Devon Vance',
        'first_name' => 'Devon',
        'last_name' => 'Vance',
        'email' => 'devon@example.com',
        'date_of_birth' => '1994-11-20',
        'gender' => 'Male',
        'civil_status' => 'Single',
        'contact_number' => '+63 912 345 6789',
        'current_address' => 'Surallah, South Cotabato',
        'permanent_address' => 'Surallah, South Cotabato',
    ]);

    $user = User::factory()->create(['alumni_profile_id' => $profile->id]);
    $alumniRole = Role::firstOrCreate(['name' => 'alumni'], ['label' => 'Alumni']);
    $user->roles()->syncWithoutDetaching([$alumniRole->id => ['created_at' => now()]]);

    $status = EmploymentStatus::firstOrCreate(['code' => 'employed', 'label' => 'Employed', 'is_active' => true]);

    Sanctum::actingAs($user, ['api']);

    $response = $this->postJson("/api/alumni/{$profile->id}/employment", [
        'employment_status_id' => $status->id,
        'employer_name' => 'Dev Studio',
        'job_title' => 'Software Engineer',
        'is_related_to_degree' => true,
        'started_on' => '2023-01-15',
    ])->assertCreated();

    expect($response->json('data.is_related_to_degree'))->toBeTrue();

    $this->assertDatabaseHas('alumni_employment_records', [
        'alumni_id' => $profile->id,
        'employer_name' => 'Dev Studio',
        'is_related_to_degree' => true,
    ]);
});
