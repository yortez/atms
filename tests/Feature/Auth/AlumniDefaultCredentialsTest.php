<?php

use App\Models\AlumniProfile;
use App\Models\AlumniRegistrationAssistanceRequest;
use App\Models\Role;
use App\Models\User;
use App\Services\AlumniCredentialService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;

test('generates default alumni username from last name and first name initial', function () {
    $service = app(AlumniCredentialService::class);

    expect($service->generateBaseUsername('Clarisse', 'A.', 'Dela Cruz'))->toBe('dela_cruz_c')
        ->and($service->generateBaseUsername(null, null, null, 'Clarisse A. Dela Cruz'))->toBe('dela_cruz_c')
        ->and($service->generateBaseUsername('Clarisse', '', 'Dela Cruz'))->toBe('dela_cruz_c')
        ->and($service->generateBaseUsername(null, null, null, 'Clarisse Dela Cruz'))->toBe('dela_cruz_c');
});

test('disambiguates duplicate alumni usernames sequentially', function () {
    $service = app(AlumniCredentialService::class);

    User::factory()->create(['username' => 'dela_cruz_c']);
    User::factory()->create(['username' => 'dela_cruz_c1']);

    expect($service->generateUniqueUsername('Clarisse', 'A.', 'Dela Cruz'))->toBe('dela_cruz_c2');
});

test('csv import provisions default alumni account with generated username and student number password', function () {
    $coordinator = User::factory()->create();
    $role = Role::firstOrCreate(['name' => 'alumni-coordinator'], ['label' => 'Alumni Coordinator']);
    $coordinator->roles()->syncWithoutDetaching([$role->id => ['created_at' => now()]]);

    Sanctum::actingAs($coordinator, ['api']);

    $csvContent = implode("\n", [
        'student_number,first_name,middle_name,last_name,date_of_birth,email,program_code,graduation_year,honors,gwa',
        '2020-00123,Clarisse,A.,Dela Cruz,1999-05-14,clarisse.delacruz@example.com,BSIT,2024,,',
        '2020-00124,Carlo,Alonzo,Dela Cruz,1999-08-20,carlo.delacruz@example.com,BSIT,2024,,',
        '2020-00125,Clarisse,,Dela Cruz,2000-01-10,clarisse2@example.com,BSIT,2024,,',
    ]);

    $file = UploadedFile::fake()->createWithContent('alumni.csv', $csvContent);

    $this->postJson('/api/alumni/import', ['file' => $file])->assertOk();

    $clarisse = User::query()->where('email', 'clarisse.delacruz@example.com')->first();
    $carlo = User::query()->where('email', 'carlo.delacruz@example.com')->first();
    $clarisseNoMiddle = User::query()->where('email', 'clarisse2@example.com')->first();

    expect($clarisse)->not->toBeNull()
        ->and($clarisse->username)->toBe('dela_cruz_c')
        ->and(Hash::check('2020-00123', $clarisse->password))->toBeTrue()
        ->and($clarisse->hasRole('alumni'))->toBeTrue()
        ->and($carlo?->username)->toBe('dela_cruz_c1')
        ->and(Hash::check('2020-00124', (string) $carlo?->password))->toBeTrue()
        ->and($clarisseNoMiddle?->username)->toBe('dela_cruz_c2')
        ->and(Hash::check('2020-00125', (string) $clarisseNoMiddle?->password))->toBeTrue();

    // Sign in via Fortify /login using username + student number
    auth()->shouldUse('web');
    auth()->guard('web')->logout();
    $this->post(route('login.store'), [
        'email' => 'dela_cruz_c',
        'password' => '2020-00123',
    ])->assertRedirect(route('dashboard', absolute: false));

    $this->assertAuthenticatedAs($clarisse, 'web');

    // Sign in via Fortify /login using email + student number
    auth()->guard('web')->logout();
    $this->post(route('login.store'), [
        'email' => 'clarisse.delacruz@example.com',
        'password' => '2020-00123',
    ])->assertRedirect(route('dashboard', absolute: false));

    $this->assertAuthenticatedAs($clarisse, 'web');
});

test('manual alumni creation with student number provisions default account and exposes username', function () {
    $coordinator = User::factory()->create();
    $role = Role::firstOrCreate(['name' => 'alumni-coordinator'], ['label' => 'Alumni Coordinator']);
    $coordinator->roles()->syncWithoutDetaching([$role->id => ['created_at' => now()]]);

    Sanctum::actingAs($coordinator, ['api']);

    $response = $this->postJson('/api/alumni', [
        'name' => 'Clarisse A. Dela Cruz',
        'first_name' => 'Clarisse',
        'middle_name' => 'A.',
        'last_name' => 'Dela Cruz',
        'email' => 'clarisse.manual@example.com',
        'date_of_birth' => '1999-05-14',
        'student_number' => '2021-00555',
        'graduation_year' => 2025,
    ])->assertCreated();

    $response->assertJsonPath('data.username', 'dela_cruz_c');

    $profile = AlumniProfile::query()->findOrFail($response->json('data.id'));
    $user = $profile->user;

    expect($user)->not->toBeNull()
        ->and($user->username)->toBe('dela_cruz_c')
        ->and(Hash::check('2021-00555', $user->password))->toBeTrue();
});

test('pre-provisioned alumni account can be claimed via registration to set personal email and password while keeping username', function () {
    $coordinator = User::factory()->create();
    $role = Role::firstOrCreate(['name' => 'alumni-coordinator'], ['label' => 'Alumni Coordinator']);
    $coordinator->roles()->syncWithoutDetaching([$role->id => ['created_at' => now()]]);

    Sanctum::actingAs($coordinator, ['api']);

    $csvContent = implode("\n", [
        'student_number,first_name,middle_name,last_name,date_of_birth,email,program_code,graduation_year,honors,gwa',
        '2020-00123,Clarisse,A.,Dela Cruz,1999-05-14,clarisse.old@example.com,BSIT,2024,,',
    ]);

    $this->postJson('/api/alumni/import', [
        'file' => UploadedFile::fake()->createWithContent('alumni.csv', $csvContent),
    ])->assertOk();

    $user = User::query()->where('username', 'dela_cruz_c')->firstOrFail();
    $userId = $user->id;

    auth()->shouldUse('web');
    auth()->guard('web')->logout();

    // Claim the pre-provisioned account via /register with personal email and custom password
    $this->post(route('register.store'), [
        'registration_type' => 'alumni',
        'name' => 'Clarisse A. Dela Cruz',
        'last_name' => 'Dela Cruz',
        'student_number' => '2020-00123',
        'date_of_birth' => '1999-05-14',
        'email' => 'clarisse.personal@example.com',
        'password' => 'MyCustomPass123!',
        'password_confirmation' => 'MyCustomPass123!',
    ])->assertRedirect(route('dashboard', absolute: false));

    $user->refresh();
    expect($user->id)->toBe($userId)
        ->and($user->username)->toBe('dela_cruz_c')
        ->and($user->email)->toBe('clarisse.personal@example.com')
        ->and(Hash::check('MyCustomPass123!', $user->password))->toBeTrue();

    // Attempting to claim the already-claimed record a second time is rejected
    auth()->guard('web')->logout();
    $this->from(route('register'))
        ->post(route('register.store'), [
            'registration_type' => 'alumni',
            'name' => 'Clarisse A. Dela Cruz',
            'last_name' => 'Dela Cruz',
            'student_number' => '2020-00123',
            'date_of_birth' => '1999-05-14',
            'email' => 'another.email@example.com',
            'password' => 'AnotherPass123!',
            'password_confirmation' => 'AnotherPass123!',
        ])
        ->assertRedirect(route('register'))
        ->assertSessionHasErrors('student_number');

    $this->assertGuest('web');
});

test('registration assistance provision_account defaults password to student number and assigns generated username', function () {
    $admin = User::factory()->create(['email_verified_at' => now()]);
    $role = Role::firstOrCreate(['name' => 'system-administrator'], ['label' => 'System Administrator']);
    $admin->roles()->syncWithoutDetaching([$role->id => ['created_at' => now()]]);

    Sanctum::actingAs($admin, ['api']);

    $assistance = AlumniRegistrationAssistanceRequest::create([
        'name' => 'Clarisse A. Dela Cruz',
        'email' => 'clarisse.assist@example.com',
        'date_of_birth' => '1999-05-14',
        'student_number' => '2022-00888',
        'graduation_year' => 2026,
        'status' => 'pending',
    ]);

    $this->patchJson("/api/registration-assistance/{$assistance->id}", [
        'status' => 'reviewed',
        'resolution_action' => 'provision_account',
    ])->assertOk();

    $user = User::query()->where('email', 'clarisse.assist@example.com')->first();

    expect($user)->not->toBeNull()
        ->and($user->username)->toBe('dela_cruz_c')
        ->and(Hash::check('2022-00888', $user->password))->toBeTrue()
        ->and($user->hasRole('alumni'))->toBeTrue();
});
