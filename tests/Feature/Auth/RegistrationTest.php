<?php

use App\Models\AlumniProfile;
use App\Models\AlumniStudentNumber;
use Laravel\Fortify\Features;

beforeEach(function () {
    $this->skipUnlessFortifyHas(Features::registration());
});

test('registration screen can be rendered', function () {
    $response = $this->get(route('register'));

    $response->assertOk();
});

test('new users can register', function () {
    $profile = AlumniProfile::create([
        'name' => 'Test User',
        'email' => 'test@example.com',
        'date_of_birth' => '1990-01-02',
    ]);

    AlumniStudentNumber::create([
        'alumni_profile_id' => $profile->id,
        'student_number' => '2020-00123',
    ]);

    $response = $this->post(route('register.store'), [
        'name' => 'Test User',
        'email' => 'test@example.com',
        'student_number' => '2020-00123',
        'date_of_birth' => '1990-01-02',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    $this->assertAuthenticated();
    expect(auth()->user()->alumni_profile_id)->toBe($profile->id);
    expect(auth()->user()->hasVerifiedEmail())->toBeTrue();
    $this->assertDatabaseHas('alumni_registration_logs', [
        'event' => 'registration_completed',
        'alumni_profile_id' => $profile->id,
    ]);
    $this->assertDatabaseHas('alumni_registration_logs', [
        'event' => 'account_auto_verified',
        'alumni_profile_id' => $profile->id,
    ]);
    $response->assertRedirect(route('dashboard', absolute: false));
});
