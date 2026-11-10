<?php

use App\Models\AcademicProgram;
use App\Models\AlumniEmploymentRecord;
use App\Models\AlumniProfile;
use App\Models\Announcement;
use App\Models\Degree;
use App\Models\Department;
use App\Models\Employer;
use App\Models\EmploymentStatus;
use App\Models\JobApplication;
use App\Models\JobPosting;
use App\Models\ProgramDegree;
use App\Models\Role;
use App\Models\Survey;
use App\Models\SurveyResponse;
use App\Models\User;
use Laravel\Sanctum\Sanctum;

function phaseFiveRole(User $user, string $roleName): void
{
    $role = Role::query()->firstOrCreate(['name' => $roleName], ['label' => str($roleName)->headline()]);
    $user->roles()->syncWithoutDetaching([$role->id => ['created_at' => now()]]);
}

function phaseFiveEmployer(User $user, string $company, string $verification = 'verified'): Employer
{
    $employer = Employer::create([
        'company_name' => $company,
        'contact_email' => strtolower(str_replace(' ', '', $company)).'@example.test',
        'verification_status' => $verification,
        'verified_at' => $verification === 'verified' ? now() : null,
    ]);
    $employer->users()->attach($user->id, ['membership_role' => 'owner', 'created_at' => now()]);
    phaseFiveRole($user, 'employer');

    return $employer;
}

function phaseFiveProfile(User $user, string $name): AlumniProfile
{
    $profile = AlumniProfile::create([
        'name' => $name,
        'email' => strtolower(str_replace(' ', '', $name)).'@example.test',
        'date_of_birth' => '1990-01-01',
        'gender' => 'Male',
        'civil_status' => 'Single',
        'contact_number' => '+63 912 345 6789',
        'current_address' => 'Bacolod City, Negros Occidental',
        'permanent_address' => 'Bacolod City, Negros Occidental',
    ]);
    $user->alumniProfile()->associate($profile);
    $user->save();
    phaseFiveRole($user, 'alumni');

    return $profile;
}

test('staff can publish surveys and linked alumni can respond once', function () {
    $staff = User::factory()->create();
    phaseFiveRole($staff, 'alumni-coordinator');
    Sanctum::actingAs($staff, ['api']);
    $response = $this->postJson('/api/surveys', [
        'title' => 'Graduate outcomes',
        'description' => 'Annual follow up.',
        'questions' => [
            ['prompt' => 'Current status?', 'type' => 'select', 'options' => ['Employed', 'Studying']],
            ['prompt' => 'Details', 'type' => 'text', 'is_required' => false],
        ],
    ])->assertCreated();
    $surveyId = $response->json('data.id');

    Sanctum::actingAs($staff, ['api']);
    $this->postJson("/api/surveys/{$surveyId}/publish")->assertOk()
        ->assertJsonPath('data.status', 'published');

    $alumni = User::factory()->create();
    $profile = phaseFiveProfile($alumni, 'Survey Alumni');
    Sanctum::actingAs($alumni, ['api']);
    $this->getJson('/api/surveys')->assertOk()
        ->assertJsonPath('data.data.0.has_responded', false)
        ->assertJsonPath('data.data.0.questions.0.prompt', 'Current status?');
    Sanctum::actingAs($alumni, ['api']);
    $this->postJson("/api/surveys/{$surveyId}/responses", [
        'answers' => [(string) Survey::findOrFail($surveyId)->questions()->first()->id => 'Employed'],
    ])->assertCreated();
    Sanctum::actingAs($alumni, ['api']);
    $this->postJson("/api/surveys/{$surveyId}/responses", ['answers' => []])->assertConflict();

    expect(SurveyResponse::query()->where('alumni_profile_id', $profile->id)->count())->toBe(1);
    $outsider = User::factory()->create();
    Sanctum::actingAs($outsider, ['api']);
    $this->postJson('/api/surveys', [])->assertForbidden();
});

test('department coordinators can view open surveys but cannot manage or respond', function () {
    $staff = User::factory()->create();
    phaseFiveRole($staff, 'alumni-coordinator');
    Sanctum::actingAs($staff, ['api']);
    $published = $this->postJson('/api/surveys', [
        'title' => 'Public outcomes survey',
        'questions' => [['prompt' => 'What is your current role?', 'type' => 'text']],
    ])->assertCreated();
    $publishedId = $published->json('data.id');

    Sanctum::actingAs($staff, ['api']);
    $this->postJson("/api/surveys/{$publishedId}/publish")->assertOk();
    Sanctum::actingAs($staff, ['api']);
    $this->postJson('/api/surveys', [
        'title' => 'Draft outcomes survey',
        'questions' => [['prompt' => 'Draft question?', 'type' => 'text']],
    ])->assertCreated();

    $departmentCoordinator = User::factory()->create();
    phaseFiveRole($departmentCoordinator, 'department-coordinator');
    Sanctum::actingAs($departmentCoordinator, ['api']);
    $this->getJson('/api/surveys')->assertOk()
        ->assertJsonCount(1, 'data.data')
        ->assertJsonPath('data.data.0.title', 'Public outcomes survey')
        ->assertJsonPath('data.data.0.questions.0.prompt', 'What is your current role?')
        ->assertJsonMissingPath('data.data.0.has_responded');

    Sanctum::actingAs($departmentCoordinator, ['api']);
    $this->postJson('/api/surveys', [])->assertForbidden();
    Sanctum::actingAs($departmentCoordinator, ['api']);
    $this->postJson("/api/surveys/{$publishedId}/responses", ['answers' => []])->assertForbidden();
});

test('announcements are staff-managed and audience-restricted', function () {
    $staff = User::factory()->create();
    phaseFiveRole($staff, 'alumni-coordinator');
    $alumni = User::factory()->create();
    phaseFiveRole($alumni, 'alumni');
    Sanctum::actingAs($staff, ['api']);
    $created = $this->postJson('/api/announcements', [
        'title' => 'Alumni event',
        'body' => 'Registration is open.',
        'audience_roles' => ['alumni'],
    ])->assertCreated();
    $announcementId = $created->json('data.id');
    Sanctum::actingAs($staff, ['api']);
    $this->postJson("/api/announcements/{$announcementId}/publish")->assertOk();

    Sanctum::actingAs($alumni, ['api']);
    $this->getJson('/api/announcements')->assertOk()
        ->assertJsonCount(1, 'data.data')
        ->assertJsonPath('data.data.0.title', 'Alumni event');

    $employer = User::factory()->create();
    phaseFiveRole($employer, 'employer');
    Sanctum::actingAs($employer, ['api']);
    $this->getJson('/api/announcements')->assertOk()
        ->assertJsonCount(0, 'data.data');
    Sanctum::actingAs($employer, ['api']);
    $this->patchJson("/api/announcements/{$announcementId}", [
        'title' => 'Unauthorized edit',
    ])->assertForbidden();
});

test('employers can manage their own jobs and alumni can apply with linked profiles', function () {
    $owner = User::factory()->create();
    $employer = phaseFiveEmployer($owner, 'Pending Employer', 'pending');
    Sanctum::actingAs($owner, ['api']);
    $created = $this->postJson('/api/employer/jobs', [
        'employer_id' => $employer->id,
        'title' => 'Software Engineer',
        'description' => 'Build useful software.',
        'employment_type' => 'full-time',
        'workplace_type' => 'hybrid',
    ])->assertCreated();
    $jobId = $created->json('data.id');
    Sanctum::actingAs($owner, ['api']);
    $this->postJson("/api/employer/jobs/{$jobId}/publish")->assertForbidden();

    $employer->forceFill(['verification_status' => 'verified', 'verified_at' => now()])->save();
    Sanctum::actingAs($owner, ['api']);
    $this->postJson("/api/employer/jobs/{$jobId}/publish")->assertOk();

    $alumni = User::factory()->create();
    $profile = phaseFiveProfile($alumni, 'Applicant Alumni');
    $unlinkedAlumni = User::factory()->create();
    phaseFiveRole($unlinkedAlumni, 'alumni');
    Sanctum::actingAs($unlinkedAlumni, ['api']);
    $this->postJson("/api/jobs/{$jobId}/applications", [])->assertForbidden();

    Sanctum::actingAs($alumni, ['api']);
    $this->getJson('/api/jobs')->assertOk()
        ->assertJsonPath('data.data.0.title', 'Software Engineer');
    Sanctum::actingAs($alumni, ['api']);
    $this->postJson("/api/jobs/{$jobId}/applications", ['cover_letter' => 'I am interested.'])
        ->assertCreated()->assertJsonPath('data.status', 'submitted');
    Sanctum::actingAs($alumni, ['api']);
    $this->getJson('/api/applications/me')->assertOk()
        ->assertJsonPath('data.data.0.alumni_profile_id', $profile->id);

    $other = User::factory()->create();
    phaseFiveEmployer($other, 'Other Employer');
    Sanctum::actingAs($other, ['api']);
    $this->patchJson("/api/employer/jobs/{$jobId}", [
        'title' => 'Changed by other employer',
    ])->assertForbidden();
    $roleOnlyUser = User::factory()->create();
    phaseFiveRole($roleOnlyUser, 'employer');
    Sanctum::actingAs($roleOnlyUser, ['api']);
    $this->postJson('/api/employer/jobs', [
        'employer_id' => $employer->id,
        'title' => 'Unauthorized posting',
        'description' => 'Must have an employer membership.',
    ])->assertForbidden();

    Sanctum::actingAs($owner, ['api']);
    $this->getJson("/api/employer/jobs/{$jobId}/applications")
        ->assertOk()->assertJsonPath('data.data.0.alumni_profile_id', $profile->id);
    $applicationId = JobApplication::query()->firstOrFail()->id;
    Sanctum::actingAs($owner, ['api']);
    $this->patchJson("/api/applications/{$applicationId}/status", [
        'status' => 'shortlisted',
    ])->assertOk()->assertJsonPath('data.status', 'shortlisted');
});

test('dashboard statistics expose aggregate outcomes and module counts to staff only', function () {
    $staff = User::factory()->create();
    phaseFiveRole($staff, 'alumni-coordinator');
    $employer = phaseFiveEmployer(User::factory()->create(), 'Dashboard Employer');
    JobPosting::create([
        'employer_id' => $employer->id,
        'title' => 'Dashboard Job',
        'description' => 'Aggregate test job.',
        'status' => 'published',
        'published_at' => now(),
    ]);
    Survey::create([
        'title' => 'Dashboard survey',
        'status' => 'published',
        'published_at' => now(),
        'created_by_user_id' => $staff->id,
    ]);
    Announcement::create([
        'title' => 'Dashboard announcement',
        'body' => 'Aggregate test announcement.',
        'status' => 'published',
        'published_at' => now(),
        'created_by_user_id' => $staff->id,
    ]);

    Sanctum::actingAs($staff, ['api']);
    $this->getJson('/api/dashboard')->assertOk()
        ->assertJsonPath('data.role', 'alumni-coordinator')
        ->assertJsonPath('data.metrics.employers.total', 1)
        ->assertJsonPath('data.metrics.jobs.published', 1)
        ->assertJsonPath('data.metrics.survey_count', 1)
        ->assertJsonPath('data.metrics.announcements_published_count', 1)
        ->assertJsonPath('data.metrics.applications.total', 0)
        ->assertJsonPath('data.metrics.alumni_count', 0)
        ->assertJsonStructure(['data' => [
            'role',
            'metrics' => [
                'alumni_count', 'users_count', 'survey_count', 'survey_response_count',
                'announcements_published_count',
                'employers' => ['total', 'verified', 'pending'],
                'jobs' => ['total', 'published'],
                'applications' => ['total', 'by_status'],
            ],
            'employment_outcomes',
        ]]);

    $regularUser = User::factory()->create();
    Sanctum::actingAs($regularUser, ['api']);
    $this->getJson('/api/dashboard')->assertForbidden();
});

test('alumni dashboard contains only the signed-in alumnus own and visible aggregates', function () {
    $alumni = User::factory()->create();
    $profile = phaseFiveProfile($alumni, 'Private Dashboard Alumni');
    $otherAlumni = User::factory()->create();
    $otherProfile = phaseFiveProfile($otherAlumni, 'Other Dashboard Alumni');

    $status = EmploymentStatus::create(['code' => 'employed', 'label' => 'Employed']);
    AlumniEmploymentRecord::create([
        'alumni_id' => $profile->id,
        'employment_status_id' => $status->id,
        'reported_at' => now(),
    ]);
    AlumniEmploymentRecord::create([
        'alumni_id' => $otherProfile->id,
        'employment_status_id' => $status->id,
        'reported_at' => now(),
    ]);

    $survey = Survey::create([
        'title' => 'Open survey',
        'status' => 'published',
        'published_at' => now(),
        'created_by_user_id' => User::factory()->create()->id,
    ]);
    SurveyResponse::create([
        'survey_id' => $survey->id,
        'alumni_profile_id' => $profile->id,
        'answers' => [],
        'submitted_at' => now(),
    ]);
    SurveyResponse::create([
        'survey_id' => $survey->id,
        'alumni_profile_id' => $otherProfile->id,
        'answers' => [],
        'submitted_at' => now(),
    ]);

    Announcement::create([
        'title' => 'Everyone',
        'body' => 'Visible to everyone.',
        'status' => 'published',
        'published_at' => now(),
        'created_by_user_id' => $alumni->id,
    ]);
    Announcement::create([
        'title' => 'Alumni only',
        'body' => 'Visible to alumni.',
        'audience_roles' => ['alumni'],
        'status' => 'published',
        'published_at' => now(),
        'created_by_user_id' => $alumni->id,
    ]);
    Announcement::create([
        'title' => 'Employer only',
        'body' => 'Not visible to alumni.',
        'audience_roles' => ['employer'],
        'status' => 'published',
        'published_at' => now(),
        'created_by_user_id' => $alumni->id,
    ]);

    $jobOwner = User::factory()->create();
    $verifiedEmployer = phaseFiveEmployer($jobOwner, 'Verified Dashboard Employer');
    JobPosting::create([
        'employer_id' => $verifiedEmployer->id,
        'title' => 'Open Job',
        'description' => 'Open.',
        'status' => 'published',
        'published_at' => now(),
    ]);
    JobPosting::create([
        'employer_id' => $verifiedEmployer->id,
        'title' => 'Closed Job',
        'description' => 'Closed.',
        'closes_at' => today()->subDay(),
        'status' => 'published',
        'published_at' => now(),
    ]);
    $pendingEmployer = phaseFiveEmployer(User::factory()->create(), 'Pending Dashboard Employer', 'pending');
    JobPosting::create([
        'employer_id' => $pendingEmployer->id,
        'title' => 'Unverified Job',
        'description' => 'Not public.',
        'status' => 'published',
        'published_at' => now(),
    ]);

    $applicationJob = JobPosting::query()->where('title', 'Open Job')->firstOrFail();
    JobApplication::create([
        'job_posting_id' => $applicationJob->id,
        'alumni_profile_id' => $profile->id,
        'applicant_user_id' => $alumni->id,
        'status' => 'submitted',
    ]);
    JobApplication::create([
        'job_posting_id' => $applicationJob->id,
        'alumni_profile_id' => $otherProfile->id,
        'applicant_user_id' => $otherAlumni->id,
        'status' => 'hired',
    ]);

    Sanctum::actingAs($alumni, ['api']);
    $this->getJson('/api/dashboard/stats')->assertOk()
        ->assertJsonPath('data.role', 'alumni')
        ->assertJsonPath('data.metrics.alumni_count', 1)
        ->assertJsonPath('data.metrics.users_count', 0)
        ->assertJsonPath('data.metrics.survey_count', 1)
        ->assertJsonPath('data.metrics.survey_response_count', 1)
        ->assertJsonPath('data.metrics.announcements_published_count', 2)
        ->assertJsonPath('data.metrics.employers.total', 0)
        ->assertJsonPath('data.metrics.jobs.total', 1)
        ->assertJsonPath('data.metrics.applications.total', 1)
        ->assertJsonPath('data.metrics.applications.by_status.0.status', 'submitted')
        ->assertJsonCount(1, 'data.employment_outcomes')
        ->assertJsonPath('data.employment_outcomes.0.alumni_count', 1);
});

test('employer dashboard and mine endpoint only include member companies and their aggregates', function () {
    $owner = User::factory()->create();
    $ownEmployer = phaseFiveEmployer($owner, 'Own Dashboard Company');
    $ownEmployer2 = phaseFiveEmployer($owner, 'Second Dashboard Company');
    $otherOwner = User::factory()->create();
    $otherEmployer = phaseFiveEmployer($otherOwner, 'Other Dashboard Company');

    $ownJob = JobPosting::create([
        'employer_id' => $ownEmployer->id,
        'title' => 'Own Job',
        'description' => 'Own.',
        'status' => 'published',
        'published_at' => now(),
    ]);
    JobPosting::create([
        'employer_id' => $ownEmployer2->id,
        'title' => 'Own Draft',
        'description' => 'Own draft.',
        'status' => 'draft',
    ]);
    $otherJob = JobPosting::create([
        'employer_id' => $otherEmployer->id,
        'title' => 'Other Job',
        'description' => 'Other.',
        'status' => 'published',
        'published_at' => now(),
    ]);

    $applicant = User::factory()->create();
    $applicantProfile = phaseFiveProfile($applicant, 'Employer Dashboard Applicant');
    JobApplication::create([
        'job_posting_id' => $ownJob->id,
        'alumni_profile_id' => $applicantProfile->id,
        'applicant_user_id' => $applicant->id,
        'status' => 'submitted',
    ]);
    JobApplication::create([
        'job_posting_id' => $otherJob->id,
        'alumni_profile_id' => $applicantProfile->id,
        'applicant_user_id' => $applicant->id,
        'status' => 'hired',
    ]);

    Sanctum::actingAs($owner, ['api']);
    $this->getJson('/api/employers/mine')->assertOk()
        ->assertJsonCount(2, 'data')
        ->assertJsonMissing(['company_name' => 'Other Dashboard Company'])
        ->assertJsonMissingPath('data.0.contact_email')
        ->assertJsonMissingPath('data.0.users');
    $this->getJson('/api/dashboard/stats')->assertOk()
        ->assertJsonPath('data.role', 'employer')
        ->assertJsonPath('data.metrics.alumni_count', 0)
        ->assertJsonPath('data.metrics.survey_count', 0)
        ->assertJsonPath('data.metrics.employers.total', 2)
        ->assertJsonPath('data.metrics.employers.verified', 2)
        ->assertJsonPath('data.metrics.jobs.total', 2)
        ->assertJsonPath('data.metrics.jobs.published', 1)
        ->assertJsonPath('data.metrics.applications.total', 1)
        ->assertJsonPath('data.metrics.applications.by_status.0.status', 'submitted')
        ->assertJsonCount(0, 'data.employment_outcomes');

    $nonMemberEmployerRole = User::factory()->create();
    phaseFiveRole($nonMemberEmployerRole, 'employer');
    Sanctum::actingAs($nonMemberEmployerRole, ['api']);
    $this->getJson('/api/employers/mine')->assertOk()->assertExactJson(['data' => []]);
    $this->getJson('/api/dashboard/stats')->assertOk()
        ->assertJsonPath('data.metrics.employers.total', 0)
        ->assertJsonPath('data.metrics.jobs.total', 0)
        ->assertJsonPath('data.metrics.applications.total', 0);
});

test('department dashboard aggregate counts and employment outcomes are program scoped', function () {
    $department = Department::create(['code' => 'SCOPED', 'name' => 'Scoped Department']);
    $program = AcademicProgram::create([
        'department_id' => $department->id,
        'code' => 'SCOPED-IT',
        'name' => 'Scoped IT',
    ]);
    $otherDepartment = Department::create(['code' => 'OTHER', 'name' => 'Other Department']);
    $otherProgram = AcademicProgram::create([
        'department_id' => $otherDepartment->id,
        'code' => 'OTHER-BA',
        'name' => 'Other Business',
    ]);
    $degree = Degree::create([
        'code' => 'SCOPED-BS',
        'title' => 'Bachelor of Science',
        'degree_level' => 'undergraduate',
    ]);
    $offering = ProgramDegree::create([
        'program_id' => $program->id,
        'degree_id' => $degree->id,
    ]);
    $otherOffering = ProgramDegree::create([
        'program_id' => $otherProgram->id,
        'degree_id' => $degree->id,
    ]);

    $coordinator = User::factory()->create();
    phaseFiveRole($coordinator, 'department-coordinator');
    $coordinator->assignedPrograms()->attach($program->id, ['created_at' => now()]);

    $visibleUser = User::factory()->create();
    $visibleProfile = phaseFiveProfile($visibleUser, 'Visible Scoped Alumni');
    $visibleProfile->educationRecords()->create([
        'student_number' => 'SCOPED-001',
        'program_degree_id' => $offering->id,
        'graduation_year' => 2024,
    ]);

    $outsideUser = User::factory()->create();
    $outsideProfile = phaseFiveProfile($outsideUser, 'Outside Scoped Alumni');
    $outsideProfile->educationRecords()->create([
        'student_number' => 'OTHER-001',
        'program_degree_id' => $otherOffering->id,
        'graduation_year' => 2024,
    ]);

    $survey = Survey::create([
        'title' => 'Scoped survey',
        'status' => 'published',
        'published_at' => now(),
        'created_by_user_id' => $coordinator->id,
    ]);
    $outsideSurvey = Survey::create([
        'title' => 'Other survey',
        'status' => 'published',
        'published_at' => now(),
        'created_by_user_id' => $coordinator->id,
    ]);
    SurveyResponse::create([
        'survey_id' => $survey->id,
        'alumni_profile_id' => $visibleProfile->id,
        'answers' => [],
        'submitted_at' => now(),
    ]);
    SurveyResponse::create([
        'survey_id' => $outsideSurvey->id,
        'alumni_profile_id' => $outsideProfile->id,
        'answers' => [],
        'submitted_at' => now(),
    ]);

    $status = EmploymentStatus::create(['code' => 'employed', 'label' => 'Employed']);
    foreach ([$visibleProfile, $outsideProfile] as $profile) {
        AlumniEmploymentRecord::create([
            'alumni_id' => $profile->id,
            'employment_status_id' => $status->id,
            'reported_at' => now(),
        ]);
    }

    Sanctum::actingAs($coordinator, ['api']);
    $this->getJson('/api/dashboard/stats')->assertOk()
        ->assertJsonPath('data.role', 'department-coordinator')
        ->assertJsonPath('data.metrics.alumni_count', 1)
        ->assertJsonPath('data.metrics.users_count', 1)
        ->assertJsonPath('data.metrics.survey_count', 1)
        ->assertJsonPath('data.metrics.survey_response_count', 1)
        ->assertJsonPath('data.metrics.employers.total', 0)
        ->assertJsonPath('data.metrics.jobs.total', 0)
        ->assertJsonPath('data.metrics.applications.total', 0)
        ->assertJsonCount(1, 'data.employment_outcomes')
        ->assertJsonPath('data.employment_outcomes.0.alumni_count', 1);
});
