<?php

use App\Models\AcademicProgram;
use App\Models\AlumniEducationRecord;
use App\Models\AlumniEmploymentRecord;
use App\Models\AlumniProfile;
use App\Models\Degree;
use App\Models\Department;
use App\Models\Employer;
use App\Models\EmploymentStatus;
use App\Models\JobApplication;
use App\Models\JobPosting;
use App\Models\ProgramDegree;
use App\Models\Role;
use App\Models\Survey;
use App\Models\SurveyQuestion;
use App\Models\SurveyResponse;
use App\Models\User;
use App\Services\AlumniReportService;
use Laravel\Sanctum\Sanctum;

function seedInstitutionalReportFixture(): array
{
    $deptCS = Department::create(['code' => 'CCS', 'name' => 'College of Computer Studies']);
    $deptBA = Department::create(['code' => 'CBA', 'name' => 'College of Business Administration']);

    $progIT = AcademicProgram::create(['department_id' => $deptCS->id, 'code' => 'BSIT', 'name' => 'BS Information Technology']);
    $progBA = AcademicProgram::create(['department_id' => $deptBA->id, 'code' => 'BSBA', 'name' => 'BS Business Administration']);

    $degBS = Degree::create(['code' => 'BS', 'title' => 'Bachelor of Science', 'degree_level' => 'bachelor']);
    $degMS = Degree::create(['code' => 'MS', 'title' => 'Master of Science', 'degree_level' => 'master']);

    $pdIT = ProgramDegree::create(['program_id' => $progIT->id, 'degree_id' => $degBS->id]);
    $pdBA = ProgramDegree::create(['program_id' => $progBA->id, 'degree_id' => $degMS->id]);

    $statusEmployed = EmploymentStatus::firstOrCreate(['code' => 'employed'], ['label' => 'Employed', 'is_active' => true]);
    $statusFurther = EmploymentStatus::firstOrCreate(['code' => 'further-studies'], ['label' => 'Pursuing Further Studies', 'is_active' => true]);

    $alumni1 = AlumniProfile::create([
        'name' => 'Ada Lovelace',
        'first_name' => 'Ada',
        'last_name' => 'Lovelace',
        'email' => 'ada@example.com',
        'date_of_birth' => '1997-12-10',
    ]);
    $user1 = User::factory()->create(['alumni_profile_id' => $alumni1->id]);

    AlumniEducationRecord::create([
        'alumni_profile_id' => $alumni1->id,
        'student_number' => '2020-0001',
        'program_degree_id' => $pdIT->id,
        'graduation_year' => 2020,
        'honors' => 'Summa Cum Laude',
        'gwa' => 1.15,
    ]);

    AlumniEmploymentRecord::create([
        'alumni_id' => $alumni1->id,
        'employment_status_id' => $statusEmployed->id,
        'employer_name' => 'Analytical Engines Inc.',
        'job_title' => 'Systems Architect',
        'industry' => 'Software',
        'employment_type' => 'Full-time',
        'work_location' => 'Manila',
        'is_related_to_degree' => true,
        'started_on' => '2020-08-15',
        'reported_at' => now(),
    ]);

    $alumni2 = AlumniProfile::create([
        'name' => 'Grace Hopper',
        'first_name' => 'Grace',
        'last_name' => 'Hopper',
        'email' => 'grace@example.com',
        'date_of_birth' => '1998-05-20',
    ]);

    AlumniEducationRecord::create([
        'alumni_profile_id' => $alumni2->id,
        'student_number' => '2022-0002',
        'program_degree_id' => $pdBA->id,
        'graduation_year' => 2022,
    ]);

    AlumniEmploymentRecord::create([
        'alumni_id' => $alumni2->id,
        'employment_status_id' => $statusFurther->id,
        'employer_name' => 'Graduate University',
        'job_title' => 'MBA Candidate',
        'industry' => 'Education',
        'is_related_to_degree' => false,
        'started_on' => '2022-09-01',
        'reported_at' => now(),
    ]);

    $admin = User::factory()->create();
    $adminRole = Role::firstOrCreate(['name' => 'system-administrator'], ['label' => 'System Administrator']);
    $admin->roles()->syncWithoutDetaching([$adminRole->id => ['created_at' => now()]]);

    $survey = Survey::create([
        'title' => 'Annual Graduate Tracer Survey 2026',
        'description' => 'Institution-wide tracer study',
        'status' => 'published',
        'published_at' => now(),
        'created_by_user_id' => $admin->id,
    ]);

    $question = SurveyQuestion::create([
        'survey_id' => $survey->id,
        'prompt' => 'How relevant was your curriculum to your first job?',
        'type' => 'choice',
        'options' => ['Very Relevant', 'Moderately Relevant'],
        'is_required' => true,
        'position' => 1,
    ]);

    SurveyResponse::create([
        'survey_id' => $survey->id,
        'alumni_profile_id' => $alumni1->id,
        'answers' => [(string) $question->id => 'Very Relevant'],
        'submitted_at' => now(),
    ]);

    $employer = Employer::create([
        'company_name' => 'Apex Cloud Solutions',
        'industry' => 'Information Technology',
        'contact_email' => 'talent@apex.example',
        'verification_status' => 'verified',
        'verified_at' => now(),
    ]);

    $jobPosting = JobPosting::create([
        'employer_id' => $employer->id,
        'title' => 'Cloud Engineer',
        'description' => 'Build distributed cloud systems.',
        'location' => 'Taguig',
        'employment_type' => 'full-time',
        'workplace_type' => 'hybrid',
        'status' => 'published',
        'published_at' => now(),
    ]);

    JobApplication::create([
        'job_posting_id' => $jobPosting->id,
        'alumni_profile_id' => $alumni1->id,
        'applicant_user_id' => $user1->id,
        'status' => 'hired',
        'reviewed_at' => now(),
        'reviewed_by_user_id' => $admin->id,
    ]);

    return compact('admin', 'deptCS', 'deptBA', 'progIT', 'progBA', 'alumni1', 'alumni2');
}

test('all 18 institutional reports generate structured cards, chart series, columns, and rows', function () {
    $fixture = seedInstitutionalReportFixture();
    Sanctum::actingAs($fixture['admin'], ['api']);

    $catalogKeys = array_keys(app(AlumniReportService::class)->reportCatalog());
    expect($catalogKeys)->toHaveCount(18);

    foreach ($catalogKeys as $index => $reportType) {
        $response = $this->getJson("/api/reports?report_type={$reportType}")
            ->assertOk()
            ->assertJsonPath('data.report_type', $reportType)
            ->assertJsonPath('data.number', $index + 1);

        expect($response->json('data.cards'))->toBeArray()->not->toBeEmpty();
        expect($response->json('data.chart.series'))->toBeArray();
        expect($response->json('data.columns'))->toBeArray()->not->toBeEmpty();
        expect($response->json('data.rows'))->toBeArray()->not->toBeEmpty();
    }
});

test('institutional reports support filtering by department, program, graduation year, employment status, and date range', function () {
    $fixture = seedInstitutionalReportFixture();
    Sanctum::actingAs($fixture['admin'], ['api']);

    $res = $this->getJson('/api/reports?'.http_build_query([
        'report_type' => 'alumni_masterlist',
        'department_id' => $fixture['deptCS']->id,
        'program_id' => $fixture['progIT']->id,
        'graduation_year' => 2020,
        'employment_status' => 'employed',
        'date_from' => now()->subDay()->toDateString(),
        'date_to' => now()->addDay()->toDateString(),
    ]))->assertOk();

    $rows = $res->json('data.rows');
    expect($rows)->toHaveCount(1);
    expect($rows[0]['alumni_name'])->toBe('Ada Lovelace');
    expect($rows[0]['account_status'])->toBe('Claimed');
});

test('department coordinators are strictly scoped to their assigned academic programs in reports (Option A)', function () {
    $fixture = seedInstitutionalReportFixture();

    $deptCoord = User::factory()->create();
    $deptRole = Role::firstOrCreate(['name' => 'department-coordinator'], ['label' => 'Department Coordinator']);
    $deptCoord->roles()->syncWithoutDetaching([$deptRole->id => ['created_at' => now()]]);
    $deptCoord->assignedPrograms()->sync([$fixture['progIT']->id => ['created_at' => now()]]);

    Sanctum::actingAs($deptCoord, ['api']);

    $res = $this->getJson('/api/reports?report_type=population_by_program')->assertOk();
    $rows = $res->json('data.rows');

    expect($rows)->toHaveCount(1);
    expect($rows[0]['program_code'])->toBe('BSIT');
});

test('institutional reports can be exported as Excel (.xls) and PDF (.pdf) documents', function () {
    $fixture = seedInstitutionalReportFixture();
    Sanctum::actingAs($fixture['admin'], ['api']);

    $excelRes = $this->get('/api/reports/export/excel?report_type=graduate_tracer_summary');
    $excelRes->assertOk();
    expect($excelRes->headers->get('Content-Type'))->toContain('application/vnd.ms-excel');
    expect($excelRes->headers->get('Content-Disposition'))->toContain('graduate-tracer-summary');
    expect($excelRes->getContent())->toContain('<Workbook');
    expect($excelRes->getContent())->toContain('BSIT');

    $pdfRes = $this->get('/api/reports/export/pdf?report_type=graduate_tracer_summary');
    $pdfRes->assertOk();
    expect($pdfRes->headers->get('Content-Type'))->toContain('application/pdf');
    expect($pdfRes->headers->get('Content-Disposition'))->toContain('.pdf');
    expect( str_starts_with($pdfRes->getContent(), '%PDF-1.4'))->toBeTrue();
});

