<?php

use App\Models\AcademicProgram;
use App\Models\AlumniProfile;
use App\Models\AlumniRegistrationAssistanceRequest;
use App\Models\AlumniStudentNumber;
use App\Models\Degree;
use App\Models\Department;
use App\Models\ProgramDegree;
use App\Models\Role;
use App\Models\User;
use App\Notifications\AlumniCredentialsReleased;
use Illuminate\Notifications\AnonymousNotifiable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Inertia\Testing\AssertableInertia as Assert;
use Laravel\Sanctum\Sanctum;

function createClaimRoleUser(string $roleName): User
{
    $role = Role::firstOrCreate(['name' => $roleName], ['label' => ucfirst($roleName)]);
    $user = User::factory()->create(['email_verified_at' => now()]);
    $user->roles()->syncWithoutDetaching([$role->id]);

    return $user;
}

function createClaimProgram(string $code, string $name): AcademicProgram
{
    $dept = Department::firstOrCreate(
        ['code' => 'SOC'],
        ['name' => 'School of Computing', 'is_active' => true],
    );

    return AcademicProgram::create([
        'department_id' => $dept->id,
        'code' => $code,
        'name' => $name,
        'is_active' => true,
    ]);
}

test('registrar match diagnostics identify dob mismatch and missing records', function () {
    $admin = createClaimRoleUser('system-administrator');
    Sanctum::actingAs($admin, ['api']);

    $program = createClaimProgram('BSCS', 'BS Computer Science');

    // Official profile has birthdate 2001-05-10
    $profile = AlumniProfile::create([
        'name' => 'Elena Torres',
        'first_name' => 'Elena',
        'last_name' => 'Torres',
        'email' => 'elena.torres@example.com',
        'date_of_birth' => '2001-05-10',
        'profile_status' => 'active',
    ]);

    DB::table('alumni_education_records')->insert([
        'alumni_profile_id' => $profile->id,
        'student_number' => '2020-50001',
        'graduation_year' => 2024,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    // Request 1: Submitted with wrong birthdate (2001-05-19) -> dob_mismatch
    $mismatchReq = AlumniRegistrationAssistanceRequest::create([
        'name' => 'Elena Torres',
        'email' => 'elena.torres@example.com',
        'date_of_birth' => '2001-05-19',
        'student_number' => '2020-50001',
        'academic_program_id' => $program->id,
        'graduation_year' => 2024,
        'status' => 'pending',
    ]);

    // Request 2: Student number not in registrar records -> not_found
    $missingReq = AlumniRegistrationAssistanceRequest::create([
        'name' => 'Marco Reyes',
        'email' => 'marco.reyes@example.com',
        'date_of_birth' => '2000-11-22',
        'student_number' => '2019-99999',
        'academic_program_id' => $program->id,
        'graduation_year' => 2023,
        'status' => 'pending',
    ]);

    $response = $this->getJson('/api/registration-assistance?status=pending');

    $response->assertOk();
    $items = collect($response->json('data.data'));

    $mismatchData = $items->firstWhere('id', $mismatchReq->id);
    expect($mismatchData['registrar_match']['found'])->toBeTrue()
        ->and($mismatchData['registrar_match']['match_status'])->toBe('dob_mismatch')
        ->and($mismatchData['registrar_match']['recommended_action'])->toBe('sync_record');

    $missingData = $items->firstWhere('id', $missingReq->id);
    expect($missingData['registrar_match']['found'])->toBeFalse()
        ->and($missingData['registrar_match']['match_status'])->toBe('not_found')
        ->and($missingData['registrar_match']['recommended_action'])->toBe('create_record');
});

test('sync_record resolution updates official alumni profile to unblock self registration', function () {
    $admin = createClaimRoleUser('system-administrator');
    Sanctum::actingAs($admin, ['api']);

    $profile = AlumniProfile::create([
        'name' => 'Carlo Mendoza',
        'first_name' => 'Carlo',
        'last_name' => 'Mendoza',
        'email' => 'old.carlo@example.com',
        'date_of_birth' => '1999-01-01', // Outdated DOB in registrar record
        'profile_status' => 'active',
    ]);

    DB::table('alumni_education_records')->insert([
        'alumni_profile_id' => $profile->id,
        'student_number' => '2020-60001',
        'graduation_year' => 2024,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $requestItem = AlumniRegistrationAssistanceRequest::create([
        'name' => 'Carlo Mendoza',
        'email' => 'carlo.mendoza@example.com',
        'date_of_birth' => '1999-08-15',
        'student_number' => '2020-60001',
        'graduation_year' => 2024,
        'status' => 'pending',
    ]);

    $this->patchJson("/api/registration-assistance/{$requestItem->id}", [
        'status' => 'reviewed',
        'resolution_action' => 'sync_record',
        'graduation_year' => 2024,
        'review_note' => 'Synced birthdate with verified ID.',
    ])
        ->assertOk()
        ->assertJsonPath('data.status', 'reviewed')
        ->assertJsonPath('data.resolution_action', 'sync_record')
        ->assertJsonPath('data.resolved_alumni_profile_id', $profile->id);

    $profile->refresh();
    expect($profile->date_of_birth?->format('Y-m-d'))->toBe('1999-08-15')
        ->and($profile->email)->toBe('carlo.mendoza@example.com');
});

test('create_record and provision_account resolutions create profile and user account', function () {
    $admin = createClaimRoleUser('system-administrator');
    Sanctum::actingAs($admin, ['api']);

    $program = createClaimProgram('BSIT', 'BS Information Technology');

    $requestItem = AlumniRegistrationAssistanceRequest::create([
        'name' => 'Patricia Villanueva',
        'email' => 'patricia.v@example.com',
        'date_of_birth' => '2001-03-12',
        'student_number' => '2021-77777',
        'academic_program_id' => $program->id,
        'graduation_year' => 2025,
        'status' => 'pending',
    ]);

    $this->patchJson("/api/registration-assistance/{$requestItem->id}", [
        'status' => 'reviewed',
        'resolution_action' => 'provision_account',
        'academic_program_id' => $program->id,
        'graduation_year' => 2025,
        'temporary_password' => 'TempPass2026!',
        'review_note' => 'Account created and provisioned.',
    ])
        ->assertOk()
        ->assertJsonPath('data.resolution_action', 'provision_account');

    $edu = AlumniStudentNumber::where('student_number', '2021-77777')->first();
    expect($edu)->not->toBeNull()
        ->and($edu->graduation_year)->toBe(2025);

    $createdProfile = AlumniProfile::find($edu->alumni_profile_id);
    expect($createdProfile)->not->toBeNull()
        ->and($createdProfile->email)->toBe('patricia.v@example.com');

    $createdUser = User::where('alumni_profile_id', $createdProfile->id)->first();
    expect($createdUser)->not->toBeNull()
        ->and($createdUser->email)->toBe('patricia.v@example.com')
        ->and($createdUser->hasRole('alumni'))->toBeTrue();
});

test('public claim assistance submission stores graduation year and supports reference status lookup', function () {
    $program = createClaimProgram('BSBA', 'BS Business Administration');

    $this->post('/alumni/registration-assistance', [
        'name' => 'Hannah Lim',
        'student_number' => '2018-88888',
        'academic_program_id' => $program->id,
        'graduation_year' => 2022,
        'date_of_birth' => '1999-12-05',
        'email' => 'hannah.lim@example.com',
        'message' => 'Graduated in 2022.',
    ])->assertRedirect(route('alumni.registration-assistance.create'));

    $created = AlumniRegistrationAssistanceRequest::where('student_number', '2018-88888')->firstOrFail();
    expect($created->graduation_year)->toBe(2022)
        ->and($created->academic_program_id)->toBe($program->id);

    $lookupResponse = $this->get(route('alumni.registration-assistance.create', [
        'lookup_reference' => $created->id,
        'lookup_identifier' => '2018-88888',
    ]));

    $lookupResponse->assertOk();
});

test('structured assistance form matches official record by name and dob and releases credentials via status or email choice', function () {
    Notification::fake();

    $admin = createClaimRoleUser('system-administrator');
    $program = createClaimProgram('BSCS-ASSIST', 'BS Computer Science');
    $degree = Degree::create(['code' => 'BS-ASSIST', 'title' => 'BS Computer Science', 'degree_level' => 'bachelor']);
    $offering = ProgramDegree::create(['program_id' => $program->id, 'degree_id' => $degree->id]);

    $profile = AlumniProfile::create([
        'name' => 'Clarisse A. Dela Cruz',
        'first_name' => 'Clarisse',
        'middle_name' => 'A.',
        'last_name' => 'Dela Cruz',
        'email' => 'clarisse.official@example.com',
        'date_of_birth' => '1999-05-14',
        'profile_status' => 'active',
    ]);

    DB::table('alumni_education_records')->insert([
        'alumni_profile_id' => $profile->id,
        'student_number' => '2020-00123',
        'program_degree_id' => $offering->id,
        'graduation_year' => 2024,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    // 1. Alumni submits structured request without student_number
    $this->post('/alumni/registration-assistance', [
        'last_name' => 'Dela Cruz',
        'first_name' => 'Clarisse',
        'middle_name' => 'A.',
        'academic_program_id' => $program->id,
        'graduation_year' => 2024,
        'date_of_birth' => '1999-05-14',
        'email' => 'clarisse.personal@example.com',
        'message' => 'Forgot my student number and need login credentials.',
    ])->assertRedirect(route('alumni.registration-assistance.create'));

    $requestItem = AlumniRegistrationAssistanceRequest::where('email', 'clarisse.personal@example.com')->firstOrFail();
    expect($requestItem->last_name)->toBe('Dela Cruz')
        ->and($requestItem->first_name)->toBe('Clarisse')
        ->and($requestItem->middle_name)->toBe('A.')
        ->and($requestItem->student_number)->toBe('2020-00123');

    // 2. Admin inspects queue and sees matched registrar record + generated username
    Sanctum::actingAs($admin, ['api']);
    $indexRes = $this->getJson('/api/registration-assistance?status=pending')->assertOk();
    $matchedItem = collect($indexRes->json('data.data'))->firstWhere('id', $requestItem->id);
    expect($matchedItem['registrar_match']['found'])->toBeTrue()
        ->and($matchedItem['registrar_match']['match_status'])->toBe('ready_to_claim')
        ->and($matchedItem['registrar_match']['profile']['student_number'])->toBe('2020-00123')
        ->and($matchedItem['registrar_match']['profile']['username'])->toBe('dela_cruz_c');

    // 3a. Admin approves with delivery method = 'email' (sends email, hides credentials from Check Request Status)
    $this->patchJson("/api/registration-assistance/{$requestItem->id}", [
        'status' => 'reviewed',
        'resolution_action' => 'provision_account',
        'credential_delivery_method' => 'email',
        'review_note' => 'Verified! Sent to your email.',
    ])->assertOk()
        ->assertJsonPath('data.credential_delivery_method', 'email')
        ->assertJsonPath('data.released_username', 'dela_cruz_c');

    Notification::assertSentTo(
        new AnonymousNotifiable,
        AlumniCredentialsReleased::class,
        function (AlumniCredentialsReleased $notification, array $channels, object $notifiable) {
            return in_array('mail', $channels, true)
                && ($notifiable->routes['mail'] ?? null) === 'clarisse.personal@example.com'
                && $notification->username === 'dela_cruz_c'
                && $notification->password === '2020-00123';
        },
    );

    $this->get(route('alumni.registration-assistance.create', [
        'lookup_reference' => $requestItem->id,
        'lookup_identifier' => 'clarisse.personal@example.com',
    ]))->assertOk()->assertInertia(fn (Assert $page) => $page
        ->where('lookupResult.credential_delivery_method', 'email')
        ->where('lookupResult.username', null)
        ->where('lookupResult.password', null)
    );

    // 3b. Admin updates delivery method to 'status' (exposes credentials in Check Request Status without sending email)
    Notification::fake();
    $this->patchJson("/api/registration-assistance/{$requestItem->id}", [
        'status' => 'reviewed',
        'resolution_action' => 'provision_account',
        'credential_delivery_method' => 'status',
        'review_note' => 'Visible in status checker.',
    ])->assertOk()
        ->assertJsonPath('data.credential_delivery_method', 'status');

    Notification::assertNothingSent();

    $this->get(route('alumni.registration-assistance.create', [
        'lookup_reference' => $requestItem->id,
        'lookup_identifier' => 'clarisse.personal@example.com',
    ]))->assertOk()->assertInertia(fn (Assert $page) => $page
        ->where('lookupResult.credential_delivery_method', 'status')
        ->where('lookupResult.username', 'dela_cruz_c')
        ->where('lookupResult.password', '2020-00123')
    );

    // 3c. Admin updates delivery method to 'both' (sends email AND returns credentials in Check Request Status)
    Notification::fake();
    $this->patchJson("/api/registration-assistance/{$requestItem->id}", [
        'status' => 'reviewed',
        'resolution_action' => 'provision_account',
        'credential_delivery_method' => 'both',
    ])->assertOk()
        ->assertJsonPath('data.credential_delivery_method', 'both');

    Notification::assertSentTo(new AnonymousNotifiable, AlumniCredentialsReleased::class);

    $this->get(route('alumni.registration-assistance.create', [
        'lookup_reference' => $requestItem->id,
        'lookup_identifier' => 'clarisse.personal@example.com',
    ]))->assertOk()->assertInertia(fn (Assert $page) => $page
        ->where('lookupResult.credential_delivery_method', 'both')
        ->where('lookupResult.username', 'dela_cruz_c')
        ->where('lookupResult.password', '2020-00123')
    );
});
