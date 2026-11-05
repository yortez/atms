<?php

use App\Models\AlumniProfile;
use App\Models\AlumniRegistrationAssistanceRequest;
use App\Models\AlumniStudentNumber;
use Illuminate\Database\QueryException;

/**
 * @return array{name: string, email: string, student_number: string, date_of_birth: string, password: string, password_confirmation: string}
 */
function alumniRegistrationInput(string $studentNumber = '2020-00123'): array
{
    return [
        'name' => 'Test User',
        'email' => 'test@example.com',
        'student_number' => $studentNumber,
        'date_of_birth' => '1990-01-02',
        'password' => 'password',
        'password_confirmation' => 'password',
    ];
}

test('a matching alumni record can be claimed using any of its student numbers', function () {
    $profile = AlumniProfile::create([
        'name' => 'Test User',
        'email' => 'test@example.com',
        'date_of_birth' => '1990-01-02',
    ]);

    AlumniStudentNumber::create([
        'alumni_profile_id' => $profile->id,
        'student_number' => '2020-00123',
    ]);
    AlumniStudentNumber::create([
        'alumni_profile_id' => $profile->id,
        'student_number' => '2018-00987',
    ]);

    $this->post(route('register.store'), alumniRegistrationInput('2018-00987'))
        ->assertRedirect(route('dashboard', absolute: false));

    $this->assertAuthenticated();
    $this->assertDatabaseHas('users', [
        'id' => auth()->id(),
        'alumni_profile_id' => $profile->id,
    ]);
});

test('registration is denied when the record does not match', function () {
    AlumniProfile::create([
        'name' => 'Test User',
        'email' => 'test@example.com',
        'date_of_birth' => '1990-01-02',
    ])->studentNumbers()->create([
        'student_number' => '2020-00123',
    ]);

    $this->from(route('register'))
        ->post(route('register.store'), [
            ...alumniRegistrationInput('2020-00123'),
            'name' => 'Different Person',
        ])
        ->assertRedirect(route('register'))
        ->assertSessionHasErrors('student_number');

    $this->assertGuest();
    $this->assertDatabaseCount('users', 0);
    $this->assertDatabaseHas('alumni_registration_logs', [
        'event' => 'registration_denied',
    ]);
});

test('malformed personal information returns validation errors', function () {
    $this->from(route('register'))
        ->post(route('register.store'), [
            ...alumniRegistrationInput(),
            'name' => ['invalid'],
        ])
        ->assertRedirect(route('register'))
        ->assertSessionHasErrors('name');

    $this->assertDatabaseCount('users', 0);
});

test('an alumni profile cannot be claimed more than once', function () {
    AlumniProfile::create([
        'name' => 'Test User',
        'email' => 'test@example.com',
        'date_of_birth' => '1990-01-02',
    ])->studentNumbers()->create([
        'student_number' => '2020-00123',
    ]);

    $this->post(route('register.store'), alumniRegistrationInput())
        ->assertRedirect(route('dashboard', absolute: false));

    auth()->logout();

    $this->post(route('register.store'), alumniRegistrationInput())
        ->assertSessionHasErrors('email');

    $this->assertDatabaseCount('users', 1);
});

test('unmatched alumni can submit a request for administrative assistance', function () {
    $this->get(route('alumni.registration-assistance.create'))
        ->assertOk();

    $this->post(route('alumni.registration-assistance.store'), [
        'name' => 'Test User',
        'email' => 'test@example.com',
        'student_number' => '2020-00123',
        'date_of_birth' => '1990-01-02',
        'message' => 'Please check my alumni record.',
    ])->assertRedirect(route('alumni.registration-assistance.create'))
        ->assertSessionHas('status')
        ->assertSessionHas('reference');

    expect(AlumniRegistrationAssistanceRequest::query()->first()?->status)->toBe('pending');
    $this->assertDatabaseCount('users', 0);
    $this->assertDatabaseHas('alumni_registration_logs', [
        'event' => 'assistance_requested',
    ]);
});

test('student numbers are unique across alumni profiles', function () {
    $firstProfile = AlumniProfile::create([
        'name' => 'First User',
        'email' => 'first@example.com',
        'date_of_birth' => '1990-01-02',
    ]);
    $secondProfile = AlumniProfile::create([
        'name' => 'Second User',
        'email' => 'second@example.com',
        'date_of_birth' => '1991-02-03',
    ]);

    $firstProfile->studentNumbers()->create(['student_number' => '2020-00123']);
    $secondProfile->studentNumbers()->create(['student_number' => '2020-00123']);
})->throws(QueryException::class);
