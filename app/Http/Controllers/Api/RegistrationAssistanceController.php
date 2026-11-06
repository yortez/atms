<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AcademicProgram;
use App\Models\AlumniProfile;
use App\Models\AlumniRegistrationAssistanceRequest;
use App\Models\AlumniStudentNumber;
use App\Models\Degree;
use App\Models\ProgramDegree;
use App\Models\Role;
use App\Models\User;
use App\Services\ActivityLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class RegistrationAssistanceController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->authorize('manageRegistrationAssistance');

        $statusParam = $request->query('status');

        $query = AlumniRegistrationAssistanceRequest::query()
            ->with(['program:id,code,name', 'reviewedBy:id,name']);

        if (is_string($statusParam) && $statusParam !== '' && $statusParam !== 'all') {
            $query->where('status', $statusParam);
        }

        if (
            $request->user()->hasRole('department-coordinator')
            && ! $request->user()->hasRole('system-administrator', 'alumni-coordinator')
        ) {
            $assignedProgramIds = $request->user()->assignedPrograms()->pluck('academic_programs.id');
            $query->where(function ($q) use ($assignedProgramIds) {
                $q->whereIn('academic_program_id', $assignedProgramIds)
                    ->orWhereNull('academic_program_id');
            });
        }

        $paginator = $query
            ->orderByRaw("CASE WHEN status = 'pending' THEN 0 ELSE 1 END")
            ->latest()
            ->paginate(25);

        $studentNumbers = collect($paginator->items())
            ->pluck('student_number')
            ->filter()
            ->map(fn ($s) => Str::upper(trim((string) $s)))
            ->unique()
            ->values();

        $eduRecords = AlumniStudentNumber::query()
            ->with(['alumniProfile.user:id,alumni_profile_id,email', 'programDegree.program:id,code,name'])
            ->whereIn('student_number', $studentNumbers)
            ->get()
            ->keyBy(fn (AlumniStudentNumber $rec) => Str::upper(trim($rec->student_number)));

        foreach ($paginator->items() as $item) {
            $normalizedSn = Str::upper(trim($item->student_number));
            $edu = $eduRecords->get($normalizedSn);
            $item->setAttribute('registrar_match', $this->buildDiagnostic($item, $edu));
        }

        return response()->json([
            'data' => $paginator,
        ]);
    }

    public function update(
        Request $request,
        AlumniRegistrationAssistanceRequest $assistanceRequest,
        ActivityLogger $activityLogger,
    ): JsonResponse {
        $this->authorize('manageRegistrationAssistance');

        if (
            $request->user()->hasRole('department-coordinator')
            && ! $request->user()->hasRole('system-administrator', 'alumni-coordinator')
        ) {
            if ($assistanceRequest->academic_program_id !== null) {
                abort_unless(
                    $request->user()->assignedPrograms()->where('academic_programs.id', $assistanceRequest->academic_program_id)->exists(),
                    403,
                    'You are not authorized to review assistance requests outside your assigned programs.'
                );
            }
        }

        $data = $request->validate([
            'status' => ['required', Rule::in(['reviewed', 'needs_more_information', 'rejected'])],
            'review_note' => ['nullable', 'string', 'max:2000'],
            'resolution_action' => [
                'sometimes',
                'nullable',
                'string',
                Rule::in(['manual_review', 'sync_record', 'create_record', 'provision_account']),
            ],
            'academic_program_id' => ['sometimes', 'nullable', 'integer', 'exists:academic_programs,id'],
            'graduation_year' => ['sometimes', 'nullable', 'integer', 'min:1950', 'max:2100'],
            'temporary_password' => ['sometimes', 'nullable', 'string', 'min:8', 'max:100'],
        ]);

        $resolutionAction = $data['resolution_action'] ?? ($data['status'] === 'reviewed' ? 'manual_review' : null);
        $resolvedProfileId = $assistanceRequest->resolved_alumni_profile_id;

        DB::transaction(function () use (
            $request,
            $assistanceRequest,
            $data,
            &$resolutionAction,
            &$resolvedProfileId,
        ): void {
            if (! empty($data['academic_program_id'])) {
                $assistanceRequest->academic_program_id = (int) $data['academic_program_id'];
            }
            if (! empty($data['graduation_year'])) {
                $assistanceRequest->graduation_year = (int) $data['graduation_year'];
            }

            if ($data['status'] === 'reviewed' && in_array($resolutionAction, ['sync_record', 'create_record', 'provision_account'], true)) {
                $profile = $this->resolveAlumniProfile(
                    $assistanceRequest,
                    $resolutionAction,
                    $request->user()->id,
                );
                $resolvedProfileId = $profile->id;

                if ($resolutionAction === 'provision_account') {
                    $this->provisionUserForProfile(
                        $profile,
                        $assistanceRequest->email,
                        $assistanceRequest->name,
                        $data['temporary_password'] ?? 'Alumni@2026',
                    );
                }
            }

            $assistanceRequest->forceFill([
                'status' => $data['status'],
                'reviewed_by_user_id' => $request->user()->id,
                'reviewed_at' => now(),
                'review_note' => $data['review_note'] ?? null,
                'resolution_action' => $resolutionAction,
                'resolved_alumni_profile_id' => $resolvedProfileId,
            ])->save();
        });

        $activityLogger->record('alumni.registration_assistance_reviewed', $assistanceRequest, [
            'status' => $data['status'],
            'resolution_action' => $resolutionAction,
            'resolved_alumni_profile_id' => $resolvedProfileId,
        ]);

        return response()->json(['data' => [
            'id' => $assistanceRequest->id,
            'status' => $assistanceRequest->status,
            'resolution_action' => $assistanceRequest->resolution_action,
            'resolved_alumni_profile_id' => $assistanceRequest->resolved_alumni_profile_id,
        ]]);
    }

    /**
     * @return array<string, mixed>
     */
    private function buildDiagnostic(
        AlumniRegistrationAssistanceRequest $req,
        ?AlumniStudentNumber $edu,
    ): array {
        if (! $edu || ! $edu->alumniProfile) {
            return [
                'found' => false,
                'match_status' => 'not_found',
                'summary' => 'Student number not found in registrar records (Unimported graduate)',
                'recommended_action' => 'create_record',
                'profile' => null,
            ];
        }

        $profile = $edu->alumniProfile;
        $isClaimed = $profile->user !== null;
        $reqLastName = $this->normalizeLastName($req->name);
        $profLastName = $this->normalizeLastName($profile->last_name ?: $profile->name);
        $reqDob = $req->date_of_birth?->toDateString();
        $profDob = $profile->date_of_birth?->toDateString();

        $lastNameMatches = $reqLastName === $profLastName;
        $dobMatches = $reqDob === $profDob;

        if ($isClaimed) {
            $matchStatus = 'already_claimed';
            $summary = 'Record already claimed by '.$profile->user->email;
            $recommendedAction = 'manual_review';
        } elseif ($lastNameMatches && $dobMatches) {
            $matchStatus = 'ready_to_claim';
            $summary = 'Exact match with unclaimed registrar record (Ready to claim or provision)';
            $recommendedAction = 'provision_account';
        } elseif (! $dobMatches && $lastNameMatches) {
            $matchStatus = 'dob_mismatch';
            $summary = "Birthdate mismatch (Official: {$profDob} vs Submitted: {$reqDob})";
            $recommendedAction = 'sync_record';
        } elseif ($dobMatches && ! $lastNameMatches) {
            $matchStatus = 'name_mismatch';
            $summary = "Name mismatch (Official: {$profile->name} vs Submitted: {$req->name})";
            $recommendedAction = 'sync_record';
        } else {
            $matchStatus = 'multiple_mismatches';
            $summary = "Name & Birthdate mismatch (Official: {$profile->name}, DOB {$profDob})";
            $recommendedAction = 'sync_record';
        }

        return [
            'found' => true,
            'match_status' => $matchStatus,
            'summary' => $summary,
            'recommended_action' => $recommendedAction,
            'profile' => [
                'id' => $profile->id,
                'name' => $profile->name,
                'email' => $profile->email,
                'date_of_birth' => $profDob,
                'is_claimed' => $isClaimed,
                'program_code' => $edu->programDegree?->program?->code,
                'graduation_year' => $edu->graduation_year,
            ],
        ];
    }

    private function resolveAlumniProfile(
        AlumniRegistrationAssistanceRequest $req,
        string $resolutionAction,
        int $actorUserId,
    ): AlumniProfile {
        $normalizedSn = Str::upper(trim($req->student_number));
        $existingEdu = AlumniStudentNumber::query()
            ->with('alumniProfile')
            ->where('student_number', $normalizedSn)
            ->first();

        [$firstName, $lastName] = $this->splitName($req->name);

        if ($existingEdu && $existingEdu->alumniProfile) {
            $profile = $existingEdu->alumniProfile;

            if (in_array($resolutionAction, ['sync_record', 'provision_account'], true)) {
                $profile->forceFill([
                    'name' => $req->name,
                    'first_name' => $firstName,
                    'last_name' => $lastName,
                    'email' => $req->email,
                    'date_of_birth' => $req->date_of_birth->toDateString(),
                ])->save();
            }

            return $profile;
        }

        // Create official AlumniProfile + AlumniStudentNumber record
        $profile = AlumniProfile::create([
            'name' => $req->name,
            'first_name' => $firstName,
            'last_name' => $lastName,
            'email' => $req->email,
            'date_of_birth' => $req->date_of_birth->toDateString(),
            'profile_status' => 'active',
            'created_by_user_id' => $actorUserId,
        ]);

        $programDegreeId = $this->resolveProgramDegreeId($req->academic_program_id);

        DB::table('alumni_education_records')->insert([
            'alumni_profile_id' => $profile->id,
            'student_number' => $normalizedSn,
            'program_degree_id' => $programDegreeId,
            'graduation_year' => $req->graduation_year,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return $profile;
    }

    private function resolveProgramDegreeId(?int $programId): ?int
    {
        if (! $programId) {
            return null;
        }

        $existingOffering = ProgramDegree::query()
            ->where('program_id', $programId)
            ->first();

        if ($existingOffering) {
            return $existingOffering->id;
        }

        $program = AcademicProgram::find($programId);
        if (! $program) {
            return null;
        }

        $degree = Degree::firstOrCreate(
            ['code' => $program->code],
            [
                'title' => $program->name,
                'degree_level' => 'bachelor',
                'is_active' => true,
            ],
        );

        $offering = ProgramDegree::firstOrCreate(
            [
                'program_id' => $program->id,
                'degree_id' => $degree->id,
            ],
            ['is_active' => true],
        );

        return $offering->id;
    }

    private function provisionUserForProfile(
        AlumniProfile $profile,
        string $email,
        string $name,
        string $rawPassword,
    ): User {
        $existingByProfile = User::query()->where('alumni_profile_id', $profile->id)->first();
        if ($existingByProfile) {
            return $existingByProfile;
        }

        $user = User::query()->where('email', Str::lower(trim($email)))->first();
        if (! $user) {
            $user = new User([
                'name' => $name,
                'email' => Str::lower(trim($email)),
                'password' => $rawPassword,
                'alumni_profile_id' => $profile->id,
            ]);
            $user->email_verified_at = now();
            $user->save();
        } else {
            $user->forceFill([
                'alumni_profile_id' => $profile->id,
                'email_verified_at' => $user->email_verified_at ?? now(),
            ])->save();
        }

        $alumniRole = Role::query()->firstOrCreate(
            ['name' => 'alumni'],
            ['label' => 'Alumni'],
        );
        $user->roles()->syncWithoutDetaching([
            $alumniRole->id => ['created_at' => now()],
        ]);

        return $user;
    }

    /**
     * @return array{0: string, 1: string}
     */
    private function splitName(string $fullName): array
    {
        $parts = preg_split('/\s+/', trim($fullName)) ?: [];
        if (count($parts) <= 1) {
            return [$fullName, $fullName];
        }

        $lastName = (string) array_pop($parts);
        $firstName = implode(' ', $parts);

        return [$firstName, $lastName];
    }

    private function normalizeLastName(string $name): string
    {
        $parts = preg_split('/\s+/', trim($name)) ?: [];
        $last = $parts ? (string) end($parts) : $name;

        return Str::lower(trim($last));
    }
}
