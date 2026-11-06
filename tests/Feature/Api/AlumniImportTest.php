<?php

use App\Models\AcademicProgram;
use App\Models\AlumniEducationRecord;
use App\Models\AlumniProfile;
use App\Models\Degree;
use App\Models\Department;
use App\Models\ProgramDegree;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Laravel\Sanctum\Sanctum;

beforeEach(function () {
    $dept = Department::create(['code' => 'CCS', 'name' => 'College of Computer Studies']);
    $progIT = AcademicProgram::create(['department_id' => $dept->id, 'code' => 'BSIT', 'name' => 'BS Information Technology']);
    $progCS = AcademicProgram::create(['department_id' => $dept->id, 'code' => 'BSCS', 'name' => 'BS Computer Science']);
    $degree = Degree::create(['code' => 'BS', 'title' => 'Bachelor of Science', 'degree_level' => 'bachelor']);

    ProgramDegree::create(['program_id' => $progIT->id, 'degree_id' => $degree->id]);
    ProgramDegree::create(['program_id' => $progCS->id, 'degree_id' => $degree->id]);
});

test('alumni coordinator can batch import alumni records and link multiple degrees to one profile', function () {
    $user = User::factory()->create();
    $role = Role::firstOrCreate(['name' => 'alumni-coordinator'], ['label' => 'Alumni Coordinator']);
    $user->roles()->syncWithoutDetaching([$role->id => ['created_at' => now()]]);

    Sanctum::actingAs($user, ['api']);

    $csvContent = implode("\n", [
        'student_number,first_name,middle_name,last_name,date_of_birth,email,program_code,graduation_year,honors,gwa',
        '2020-00101,John,William,Doe,1998-04-12,john.doe@example.com,BSIT,2024,Cum Laude,1.40',
        '2024-00999,John,William,Doe,1998-04-12,john.doe@example.com,BSCS,2026,,1.35', // Same individual, second degree
        '2021-00202,Maria,Santos,Cruz,1999-11-05,maria.cruz@example.com,BSCS,2025,Magna Cum Laude,1.25',
    ]);

    $file = UploadedFile::fake()->createWithContent('alumni_roster.csv', $csvContent);

    $response = $this->postJson('/api/alumni/import', [
        'file' => $file,
    ])->assertOk();

    expect($response->json('data.total'))->toBe(3);
    expect($response->json('data.successful'))->toBe(3);
    expect($response->json('data.failed'))->toBe(0);
    // 2 unique individuals (John Doe and Maria Cruz), but 3 education records
    expect($response->json('data.profiles_created'))->toBe(2);
    expect($response->json('data.education_records_created'))->toBe(3);

    // Verify John Doe has 1 profile with 2 education records
    $johnProfile = AlumniProfile::where('last_name', 'Doe')->first();
    expect($johnProfile)->not->toBeNull();
    expect($johnProfile->educationRecords)->toHaveCount(2);
    expect($johnProfile->educationRecords->pluck('student_number')->all())->toContain('2020-00101', '2024-00999');

    // Verify GWA was stored
    $itRecord = AlumniEducationRecord::where('student_number', '2020-00101')->first();
    expect((float) $itRecord->gwa)->toBe(1.40);
    expect($itRecord->honors)->toBe('Cum Laude');
});

test('duplicate student numbers are caught during import and reported in error list', function () {
    $user = User::factory()->create();
    $role = Role::firstOrCreate(['name' => 'system-administrator'], ['label' => 'System Administrator']);
    $user->roles()->syncWithoutDetaching([$role->id => ['created_at' => now()]]);

    Sanctum::actingAs($user, ['api']);

    $csvContent = implode("\n", [
        'student_number,first_name,middle_name,last_name,date_of_birth,email,program_code,graduation_year,honors,gwa',
        '2020-DUPE-01,Carl,J,Vance,1997-01-01,carl@example.com,BSIT,2024,,',
        '2020-DUPE-01,Carl,J,Vance,1997-01-01,carl@example.com,BSIT,2024,,', // Duplicate student number
    ]);

    $file = UploadedFile::fake()->createWithContent('dupes.csv', $csvContent);

    $response = $this->postJson('/api/alumni/import', [
        'file' => $file,
    ])->assertOk();

    expect($response->json('data.total'))->toBe(2);
    expect($response->json('data.successful'))->toBe(1);
    expect($response->json('data.failed'))->toBe(1);
    expect($response->json('data.errors.0'))->toContain("Student number '2020-DUPE-01' already exists");
});

test('non-staff users cannot import alumni roster records', function () {
    $alumnus = User::factory()->create();
    $alumniRole = Role::firstOrCreate(['name' => 'alumni'], ['label' => 'Alumni']);
    $alumnus->roles()->syncWithoutDetaching([$alumniRole->id => ['created_at' => now()]]);

    Sanctum::actingAs($alumnus, ['api']);

    $file = UploadedFile::fake()->createWithContent('alumni.csv', 'dummy,content');

    $this->postJson('/api/alumni/import', ['file' => $file])->assertForbidden();
});

test('staff can download the sample CSV import template', function () {
    $coordinator = User::factory()->create();
    $role = Role::firstOrCreate(['name' => 'alumni-coordinator'], ['label' => 'Alumni Coordinator']);
    $coordinator->roles()->syncWithoutDetaching([$role->id => ['created_at' => now()]]);

    Sanctum::actingAs($coordinator, ['api']);

    $response = $this->get('/api/alumni/import-template')->assertOk();
    expect($response->headers->get('content-type'))->toContain('text/csv');
    expect($response->getContent())->toContain('student_number,first_name,middle_name,last_name,date_of_birth');
});

