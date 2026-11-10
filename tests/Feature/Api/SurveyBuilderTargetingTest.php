<?php

use App\Models\AcademicProgram;
use App\Models\AlumniEducationRecord;
use App\Models\AlumniProfile;
use App\Models\Degree;
use App\Models\Department;
use App\Models\ProgramDegree;
use App\Models\Role;
use App\Models\Survey;
use App\Models\User;
use Laravel\Sanctum\Sanctum;

function createSurveyCohortOffering(string $deptCode, string $progCode, string $progName): array
{
    $department = Department::create([
        'code' => $deptCode,
        'name' => "{$progName} Department",
    ]);
    $program = AcademicProgram::create([
        'department_id' => $department->id,
        'code' => $progCode,
        'name' => $progName,
    ]);
    $degree = Degree::create([
        'code' => "DEG-{$progCode}",
        'title' => "Bachelor of {$progName}",
        'degree_level' => 'bachelor',
    ]);
    $programDegree = ProgramDegree::create([
        'program_id' => $program->id,
        'degree_id' => $degree->id,
    ]);

    return [$department, $program, $programDegree];
}

function attachSurveyRole(User $user, string $roleName): void
{
    $role = Role::query()->firstOrCreate(
        ['name' => $roleName],
        ['label' => str($roleName)->headline()],
    );
    $user->roles()->syncWithoutDetaching([$role->id => ['created_at' => now()]]);
}

test('survey builder supports all 9 question types, cohort targeting, multi-degree matching, and anonymous analytics', function () {
    [$deptCCS, $progBSIT, $degBSIT] = createSurveyCohortOffering('CCS', 'BSIT', 'Information Technology');
    [$deptCBA, $progBSBA, $degBSBA] = createSurveyCohortOffering('CBA', 'BSBA', 'Business Administration');

    $coordinator = User::factory()->create();
    attachSurveyRole($coordinator, 'alumni-coordinator');

    Sanctum::actingAs($coordinator, ['api']);

    // 1. Create a survey with all 9 question types and cohort targeting (BSIT + batch 2020/2021)
    $createResponse = $this->postJson('/api/surveys', [
        'title' => '2026 BSIT Graduate Tracer Form',
        'description' => 'Google Forms-style tracer survey for BSIT graduates.',
        'starts_at' => today()->subDay()->toDateString(),
        'closes_at' => today()->addDays(14)->toDateString(),
        'is_anonymous' => true,
        'target_department_ids' => [$deptCCS->id],
        'target_program_ids' => [$progBSIT->id],
        'target_graduation_years' => [2020, 2021],
        'questions' => [
            ['prompt' => 'Current Job Title', 'type' => 'text', 'is_required' => true],
            ['prompt' => 'Career Progression Summary', 'type' => 'textarea', 'is_required' => false],
            ['prompt' => 'Curriculum Relevance', 'type' => 'radio', 'options' => ['Very Relevant', 'Moderately Relevant', 'Not Relevant'], 'is_required' => true],
            ['prompt' => 'Technical Skills Used', 'type' => 'multiselect', 'options' => ['Laravel', 'React', 'SQL'], 'is_required' => true],
            ['prompt' => 'Primary Work Arrangement', 'type' => 'select', 'options' => ['On-site', 'Hybrid', 'Remote'], 'is_required' => true],
            ['prompt' => 'Overall Program Satisfaction (1-5)', 'type' => 'rating', 'is_required' => true],
            ['prompt' => 'Date of First Job Offer', 'type' => 'date', 'is_required' => true],
            ['prompt' => 'Months to First Employment', 'type' => 'number', 'is_required' => true],
            ['prompt' => 'Is your job aligned with IT?', 'type' => 'boolean', 'is_required' => true],
        ],
    ])->assertCreated();

    $surveyId = $createResponse->json('data.id');
    expect($createResponse->json('data.questions'))->toHaveCount(9)
        ->and($createResponse->json('data.is_anonymous'))->toBeTrue()
        ->and($createResponse->json('data.target_program_ids'))->toBe([$progBSIT->id]);

    // Publish survey
    $this->postJson("/api/surveys/{$surveyId}/publish")
        ->assertOk()
        ->assertJsonPath('data.status', 'published');

    $survey = Survey::with('questions')->findOrFail($surveyId);
    $qMap = $survey->questions->keyBy('type');

    // 2. Multi-degree Alumnus (holds BSIT 2020 + BSBA 2024) matches cohort targeting
    $multiDegreeProfile = AlumniProfile::create([
        'name' => 'Maria Multi Degree',
        'first_name' => 'Maria',
        'last_name' => 'Multi',
        'email' => 'maria.multi@example.com',
        'date_of_birth' => '1998-04-10',
        'gender' => 'Female',
        'civil_status' => 'Single',
        'contact_number' => '+63 912 345 6789',
        'current_address' => 'Koronadal City, South Cotabato',
        'permanent_address' => 'Koronadal City, South Cotabato',
    ]);
    AlumniEducationRecord::create([
        'alumni_profile_id' => $multiDegreeProfile->id,
        'student_number' => '2020-IT-001',
        'program_degree_id' => $degBSIT->id,
        'graduation_year' => 2020,
    ]);
    AlumniEducationRecord::create([
        'alumni_profile_id' => $multiDegreeProfile->id,
        'student_number' => '2024-BA-002',
        'program_degree_id' => $degBSBA->id,
        'graduation_year' => 2024,
    ]);

    $multiDegreeUser = User::factory()->create(['alumni_profile_id' => $multiDegreeProfile->id]);
    attachSurveyRole($multiDegreeUser, 'alumni');

    // 3. Non-matching Alumnus (only BSBA 2022) should NOT see or be allowed to submit
    $bsbaOnlyProfile = AlumniProfile::create([
        'name' => 'Carlos BSBA',
        'first_name' => 'Carlos',
        'last_name' => 'BSBA',
        'email' => 'carlos.bsba@example.com',
        'date_of_birth' => '1999-09-12',
    ]);
    AlumniEducationRecord::create([
        'alumni_profile_id' => $bsbaOnlyProfile->id,
        'student_number' => '2022-BA-099',
        'program_degree_id' => $degBSBA->id,
        'graduation_year' => 2022,
    ]);
    $bsbaOnlyUser = User::factory()->create(['alumni_profile_id' => $bsbaOnlyProfile->id]);
    attachSurveyRole($bsbaOnlyUser, 'alumni');

    Sanctum::actingAs($bsbaOnlyUser, ['api']);
    $this->getJson('/api/surveys')
        ->assertOk()
        ->assertJsonCount(0, 'data.data');

    $this->postJson("/api/surveys/{$surveyId}/responses", [
        'answers' => [],
    ])->assertForbidden();

    // 4. Multi-degree Alumnus sees the survey and submits valid answers for all 9 question types
    Sanctum::actingAs($multiDegreeUser, ['api']);
    $this->getJson('/api/surveys')
        ->assertOk()
        ->assertJsonCount(1, 'data.data')
        ->assertJsonPath('data.data.0.id', $surveyId);

    $validAnswers = [
        $qMap['text']->id => 'Senior Full-Stack Engineer',
        $qMap['textarea']->id => 'Promoted within 18 months after graduation.',
        $qMap['radio']->id => 'Very Relevant',
        $qMap['multiselect']->id => ['Laravel', 'React'],
        $qMap['select']->id => 'Hybrid',
        $qMap['rating']->id => 5,
        $qMap['date']->id => '2020-07-15',
        $qMap['number']->id => 2,
        $qMap['boolean']->id => true,
    ];

    $this->postJson("/api/surveys/{$surveyId}/responses", [
        'answers' => $validAnswers,
    ])->assertCreated();

    // Enforce 1 response per unique alumnus
    $this->postJson("/api/surveys/{$surveyId}/responses", [
        'answers' => $validAnswers,
    ])->assertStatus(409);

    // 5. Analytics endpoint masks respondent identity when is_anonymous = true and closes survey
    Sanctum::actingAs($coordinator, ['api']);
    $analyticsRes = $this->getJson("/api/surveys/{$surveyId}/analytics")
        ->assertOk()
        ->assertJsonPath('data.total_responses', 1)
        ->assertJsonPath('data.is_anonymous', true);

    $firstQuestionRecent = $analyticsRes->json('data.questions.0.recent_answers.0');
    expect($firstQuestionRecent['respondent'])->toBe('Anonymous Alumnus')
        ->and($firstQuestionRecent['answer'])->toBe('Senior Full-Stack Engineer');

    $this->postJson("/api/surveys/{$surveyId}/close")
        ->assertOk()
        ->assertJsonPath('data.status', 'closed');
});
