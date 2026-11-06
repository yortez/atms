<?php

use App\Models\AcademicProgram;
use App\Models\AlumniProfile;
use App\Models\Announcement;
use App\Models\Department;
use App\Models\Employer;
use App\Models\JobPosting;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('public homepage exposes published announcements, verified jobs, and academic catalog without leaking sensitive alumni data', function () {
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
        'location' => 'Makati',
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
        ->where('publicStats.programs_count', 1)
        ->where('publicStats.departments_count', 1)
        ->where('publicStats.open_jobs_count', 1)
        ->has('publicAnnouncements', 1)
        ->where('publicAnnouncements.0.title', 'Public Homecoming Bulletin')
        ->has('publicJobs', 1)
        ->where('publicJobs.0.title', 'Senior Laravel Engineer')
        ->where('publicJobs.0.company_name', 'Verified Tech Partner')
        ->has('publicDepartments', 1)
        ->where('publicDepartments.0.code', 'CCS')
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

