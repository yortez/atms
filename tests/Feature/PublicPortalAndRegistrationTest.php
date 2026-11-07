<?php

use App\Models\AcademicProgram;
use App\Models\AlumniEmploymentRecord;
use App\Models\AlumniProfile;
use App\Models\Announcement;
use App\Models\Department;
use App\Models\Employer;
use App\Models\EmploymentStatus;
use App\Models\JobPosting;
use App\Models\Survey;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('public homepage exposes published announcements, verified jobs, live tracer metrics, and academic catalog without leaking sensitive alumni data', function () {
    $admin = User::factory()->create();

    $dept = Department::create([
        'code' => 'CCS',
        'name' => 'College of Computer Studies',
        'is_active' => true,
    ]);
    AcademicProgram::create([
        'department_id' => $dept->id,
        'code' => 'BSIT',
        'name' => 'BS Information Technology',
        'is_active' => true,
    ]);

    $alumni = AlumniProfile::create([
        'name' => 'Confidential Alumnus',
        'email' => 'private.alumnus@example.com',
        'date_of_birth' => '1996-04-12',
    ]);

    User::factory()->create([
        'alumni_profile_id' => $alumni->id,
    ]);

    $employedStatus = EmploymentStatus::firstOrCreate(
        ['code' => 'employed'],
        ['label' => 'Employed', 'is_employed' => true]
    );

    AlumniEmploymentRecord::create([
        'alumni_id' => $alumni->id,
        'employment_status_id' => $employedStatus->id,
        'employer_name' => 'South Cotabato Digital',
        'job_title' => 'Systems Analyst',
        'is_related_to_degree' => true,
        'reported_at' => now(),
    ]);

    Survey::create([
        'title' => '2026 CHED Graduate Tracer Study',
        'description' => 'Annual institutional graduate outcomes survey.',
        'status' => 'published',
        'published_at' => now()->subHour(),
        'created_by_user_id' => $admin->id,
    ]);

    Announcement::create([
        'title' => 'Public Homecoming Bulletin',
        'body' => 'Welcome back to campus!',
        'status' => 'published',
        'published_at' => now()->subHour(),
        'created_by_user_id' => $admin->id,
    ]);

    Announcement::create([
        'title' => 'Internal Draft Bulletin',
        'body' => 'Should not appear on public page',
        'status' => 'draft',
        'created_by_user_id' => $admin->id,
    ]);

    $verifiedEmployer = Employer::create([
        'company_name' => 'Verified Tech Partner',
        'industry' => 'Software',
        'contact_email' => 'careers@verified.example',
        'verification_status' => 'verified',
        'verified_at' => now(),
    ]);

    $pendingEmployer = Employer::create([
        'company_name' => 'Unverified Startup',
        'contact_email' => 'hr@unverified.example',
        'verification_status' => 'pending',
    ]);

    JobPosting::create([
        'employer_id' => $verifiedEmployer->id,
        'title' => 'Senior Laravel Engineer',
        'description' => 'Build mission-critical alumni systems.',
        'location' => 'Tupi, South Cotabato',
        'employment_type' => 'Full-time',
        'workplace_type' => 'Hybrid',
        'status' => 'published',
        'published_at' => now()->subHour(),
    ]);

    JobPosting::create([
        'employer_id' => $pendingEmployer->id,
        'title' => 'Hidden Pending Employer Job',
        'description' => 'Should not be public.',
        'status' => 'published',
        'published_at' => now()->subHour(),
    ]);

    $response = $this->get(route('home'))->assertOk();

    $response->assertInertia(fn (Assert $page) => $page
        ->component('welcome')
        ->where('publicStats.graduates_count', 1)
        ->where('publicStats.claimed_graduates_count', 1)
        ->where('publicStats.claim_rate', 100)
        ->where('publicStats.tracked_graduates_count', 1)
        ->where('publicStats.employed_graduates_count', 1)
        ->where('publicStats.employment_rate', 100)
        ->where('publicStats.degree_aligned_count', 1)
        ->where('publicStats.degree_alignment_rate', 100)
        ->where('publicStats.programs_count', 1)
        ->where('publicStats.departments_count', 1)
        ->where('publicStats.open_jobs_count', 1)
        ->where('publicStats.verified_employers_count', 1)
        ->where('publicStats.active_surveys_count', 1)
        ->has('publicAnnouncements', 1)
        ->where('publicAnnouncements.0.title', 'Public Homecoming Bulletin')
        ->has('publicJobs', 1)
        ->where('publicJobs.0.title', 'Senior Laravel Engineer')
        ->where('publicJobs.0.company_name', 'Verified Tech Partner')
        ->has('publicDepartments', 1)
        ->where('publicDepartments.0.code', 'CCS')
        ->has('publicActiveSurveys', 1)
        ->where('publicActiveSurveys.0.title', '2026 CHED Graduate Tracer Study')
    );

    expect($response->getContent())->not->toContain('private.alumnus@example.com');
    expect($response->getContent())->not->toContain('Confidential Alumnus');
});

test('employer partner can register directly from the public registration page and starts in pending verification status', function () {
    $this->get('/register?type=employer')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('auth/register')
            ->where('initialType', 'employer')
        );

    $response = $this->post(route('register.store'), [
        'registration_type' => 'employer',
        'company_name' => 'Pacific Horizon Systems',
        'industry' => 'Cloud Computing',
        'website' => 'https://pacifichorizon.example',
        'name' => 'Elena Rostova',
        'email' => 'elena@pacifichorizon.example',
        'password' => 'SecurePass123!',
        'password_confirmation' => 'SecurePass123!',
    ]);

    $response->assertRedirect(route('dashboard', absolute: false));
    $this->assertAuthenticated();

    $user = auth()->user();
    expect($user->hasRole('employer'))->toBeTrue();

    $employer = Employer::query()->where('company_name', 'Pacific Horizon Systems')->first();
    expect($employer)->not->toBeNull();
    expect($employer->verification_status)->toBe('pending');
    expect($employer->users()->whereKey($user->id)->exists())->toBeTrue();
});
