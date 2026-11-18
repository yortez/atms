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
use App\Notifications\AlumniCredentialsReleased;
use App\Services\ActivityLogger;
use App\Services\AlumniCredentialService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
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
            ->with(['alumniProfile.user:id,alumni_profile_id,username,email', 'programDegree.program:id,code,name'])
            ->whereIn('student_number', $studentNumbers)
            ->get()
            ->keyBy(fn (AlumniStudentNumber $rec) => Str::upper(trim($rec->student_number)));

        foreach ($paginator->items() as $item) {
            $normalizedSn = filled($item->student_number)
                ? Str::upper(trim((string) $item->student_number))
                : '';
            $edu = $normalizedSn !== '' ? $eduRecords->get($normalizedSn) : null;
            $matchedProfile = null;

            if ($edu === null) {
                $matchedProfile = $this->findMatchingProfile($item);
                if ($matchedProfile !== null) {
                    $firstMatchedSn = $this->selectBestStudentNumberRecord($item, $matchedProfile);
                    if ($firstMatchedSn !== null) {
                        $edu = $firstMatchedSn;
                    }
                }
            }

            $item->setAttribute('registrar_match', $this->buildDiagnostic($item, $edu, $matchedProfile));
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
            'student_number' => ['sometimes', 'nullable', 'string', 'max:64'],
            'temporary_password' => ['sometimes', 'nullable', 'string', 'min:8', 'max:100'],
            'credential_delivery_method' => ['sometimes', 'nullable', 'string', Rule::in(['status', 'email', 'both'])],
        ]);

        $resolutionAction = $data['resolution_action'] ?? ($data['status'] === 'reviewed' ? 'manual_review' : null);
        $resolvedProfileId = $assistanceRequest->resolved_alumni_profile_id;
        $deliveryMethod = $data['credential_delivery_method'] ?? 'both';
        $releasedUsername = $assistanceRequest->released_username;
        $releasedPassword = $assistanceRequest->released_password;
        $resolvedName = $assistanceRequest->name;
        $shouldSendEmail = false;

        DB::transaction(function () use (
            $request,
            $assistanceRequest,
            $data,
            $deliveryMethod,
            &$resolutionAction,
            &$resolvedProfileId,
            &$releasedUsername,
            &$releasedPassword,
            &$resolvedName,
            &$shouldSendEmail,
        ): void {
            if (! empty($data['academic_program_id'])) {
                $assistanceRequest->academic_program_id = (int) $data['academic_program_id'];
            }
            if (! empty($data['graduation_year'])) {
                $assistanceRequest->graduation_year = (int) $data['graduation_year'];
            }
            if (! empty($data['student_number'])) {
                $assistanceRequest->student_number = Str::upper(trim((string) $data['student_number']));
            }

            if ($data['status'] === 'reviewed' && in_array($resolutionAction, ['sync_record', 'create_record', 'provision_account'], true)) {
                $profile = $this->resolveAlumniProfile(
                    $assistanceRequest,
                    $resolutionAction,
                    $request->user()->id,
                );
                $resolvedProfileId = $profile->id;
                $resolvedName = $profile->name;

                $studentNumber = Str::upper(trim((string) (
                    $assistanceRequest->student_number
                    ?: $profile->studentNumbers()->orderBy('id')->value('student_number')
                    ?: ''
                )));

                if ($studentNumber !== '' && blank($assistanceRequest->student_number)) {
                    $assistanceRequest->student_number = $studentNumber;
                }

                $customPassword = ! empty($data['temporary_password']) ? (string) $data['temporary_password'] : null;
                $passwordToRelease = $customPassword ?? $studentNumber;

                if ($resolutionAction === 'provision_account' || $studentNumber !== '') {
                    $user = $this->provisionUserForProfile(
                        $profile,
                        $assistanceRequest->email,
                        $profile->name,
                        $passwordToRelease !== '' ? $passwordToRelease : 'Alumni@2026',
                        $customPassword !== null,
                    );

                    $releasedUsername = $user->username;
                    $releasedPassword = $passwordToRelease !== '' ? $passwordToRelease : null;
                    $shouldSendEmail = in_array($deliveryMethod, ['email', 'both'], true)
                        && filled($releasedUsername)
                        && filled($releasedPassword);
                }
            }

            $assistanceRequest->forceFill([
                'status' => $data['status'],
                'reviewed_by_user_id' => $request->user()->id,
                'reviewed_at' => now(),
                'review_note' => $data['review_note'] ?? null,
                'resolution_action' => $resolutionAction,
                'resolved_alumni_profile_id' => $resolvedProfileId,
                'credential_delivery_method' => $data['status'] === 'reviewed' ? $deliveryMethod : null,
                'released_username' => $releasedUsername,
                'released_password' => $releasedPassword,
            ])->save();
        });

        if ($shouldSendEmail && filled($releasedUsername) && filled($releasedPassword)) {
            Notification::route('mail', $assistanceRequest->email)->notify(
                new AlumniCredentialsReleased(
                    $resolvedName,
                    (string) $releasedUsername,
                    (string) $releasedPassword,
                    $assistanceRequest->id,
                    $data['review_note'] ?? null,
                ),
            );
        }

        $activityLogger->record('alumni.registration_assistance_reviewed', $assistanceRequest, [
            'status' => $data['status'],
            'resolution_action' => $resolutionAction,
            'resolved_alumni_profile_id' => $resolvedProfileId,
            'credential_delivery_method' => $assistanceRequest->credential_delivery_method,
        ]);

        return response()->json(['data' => [
            'id' => $assistanceRequest->id,
            'status' => $assistanceRequest->status,
            'resolution_action' => $assistanceRequest->resolution_action,
            'resolved_alumni_profile_id' => $assistanceRequest->resolved_alumni_profile_id,
            'credential_delivery_method' => $assistanceRequest->credential_delivery_method,
            'released_username' => $assistanceRequest->released_username,
        ]]);
    }

    /**
     * @return array<string, mixed>
     */
    private function buildDiagnostic(
        AlumniRegistrationAssistanceRequest $req,
        ?AlumniStudentNumber $edu,
        ?AlumniProfile $matchedProfile = null,
    ): array {
        $profile = $edu?->alumniProfile ?? $matchedProfile;

        if (! $profile) {
            return [
                'found' => false,
                'match_status' => 'not_found',
                'summary' => 'No matching alumni record found in registrar records (Unimported graduate)',
                'recommended_action' => 'create_record',
                'profile' => null,
            ];
        }

        $isClaimed = $profile->user !== null;
        $reqLastName = $this->normalizeLastName($req->last_name ?: $req->name);
        $profLastName = $this->normalizeLastName($profile->last_name ?: $profile->name);
        $reqDob = $req->date_of_birth?->toDateString();
        $profDob = $profile->date_of_birth?->toDateString();

        $lastNameMatches = $reqLastName === $profLastName;
        $firstNameMatches = blank($req->first_name) || blank($profile->first_name)
            ? true
            : Str::lower(trim((string) $req->first_name)) === Str::lower(trim((string) $profile->first_name));
        $nameMatches = $lastNameMatches && $firstNameMatches;
        $dobMatches = $reqDob === $profDob;

        $officialProgramId = $edu?->programDegree?->program_id;
        $programMatches = ! $req->academic_program_id || ! $officialProgramId || (int) $req->academic_program_id === (int) $officialProgramId;
        $yearMatches = ! $req->graduation_year || ! $edu?->graduation_year || (int) $req->graduation_year === (int) $edu->graduation_year;

        if ($nameMatches && $dobMatches) {
            if (! $programMatches || ! $yearMatches) {
                $matchStatus = 'ready_to_claim';
                $summary = 'Identity matches registrar record (Minor program/batch year difference — verify and release credentials)';
                $recommendedAction = 'provision_account';
            } elseif ($isClaimed && filled($req->student_number)) {
                $matchStatus = 'already_claimed';
                $summary = 'Exact match · Account exists ('.($profile->user->username ?: $profile->user->email).') — ready to verify and release credentials';
                $recommendedAction = 'provision_account';
            } else {
                $matchStatus = 'ready_to_claim';
                $summary = $isClaimed
                    ? 'Exact match with official registrar record (Account provisioned — ready to release credentials)'
                    : 'Exact match with registrar record (Ready to provision & release credentials)';
                $recommendedAction = 'provision_account';
            }
        } elseif (! $dobMatches && $lastNameMatches) {
            $matchStatus = 'dob_mismatch';
            $summary = "Birthdate mismatch (Official: {$profDob} vs Submitted: {$reqDob})";
            $recommendedAction = 'sync_record';
        } elseif ($dobMatches && ! $nameMatches) {
            $matchStatus = 'name_mismatch';
            $summary = "Name mismatch (Official: {$profile->name} vs Submitted: {$req->name})";
            $recommendedAction = 'sync_record';
        } else {
            $matchStatus = 'multiple_mismatches';
            $summary = "Name & Birthdate mismatch (Official: {$profile->name}, DOB {$profDob})";
            $recommendedAction = 'sync_record';
        }

        $username = $profile->user?->username
            ?? app(AlumniCredentialService::class)->generateBaseUsername(
                $profile->first_name,
                $profile->middle_name,
                $profile->last_name,
                $profile->name,
            );

        return [
            'found' => true,
            'match_status' => $matchStatus,
            'summary' => $summary,
            'recommended_action' => $recommendedAction,
            'profile' => [
                'id' => $profile->id,
                'name' => $profile->name,
                'first_name' => $profile->first_name,
                'middle_name' => $profile->middle_name,
                'last_name' => $profile->last_name,
                'student_number' => $edu?->student_number,
                'username' => $username,
                'email' => $profile->email,
                'date_of_birth' => $profDob,
                'is_claimed' => $isClaimed,
                'program_id' => $edu?->programDegree?->program?->id,
                'program_code' => $edu?->programDegree?->program?->code,
                'graduation_year' => $edu?->graduation_year,
            ],
        ];
    }

    private function findMatchingProfile(AlumniRegistrationAssistanceRequest $req): ?AlumniProfile
    {
        [$firstName, , $lastName] = filled($req->last_name) || filled($req->first_name)
            ? [trim((string) $req->first_name), trim((string) $req->middle_name), trim((string) $req->last_name)]
            : app(AlumniCredentialService::class)->parseFullName($req->name);

        if ($lastName === '' && $req->name === '') {
            return null;
        }

        $baseQuery = fn () => AlumniProfile::query()
            ->with(['user:id,alumni_profile_id,username,email', 'educationRecords.programDegree.program:id,code,name']);

        if ($firstName !== '' && $lastName !== '') {
            $match = $baseQuery()
                ->where(function ($query) use ($firstName, $lastName, $req): void {
                    $query->where(function ($sub) use ($firstName, $lastName): void {
                        $sub->whereRaw('LOWER(last_name) = ?', [Str::lower($lastName)])
                            ->whereRaw('LOWER(first_name) = ?', [Str::lower($firstName)]);
                    })->orWhereRaw('LOWER(name) = ?', [Str::lower(trim($req->name))]);
                })
                ->orderByDesc('id')
                ->first();

            if ($match !== null) {
                return $match;
            }
        }

        if ($lastName !== '' && $req->date_of_birth !== null) {
            return $baseQuery()
                ->whereRaw('LOWER(last_name) = ?', [Str::lower($lastName)])
                ->whereDate('date_of_birth', $req->date_of_birth->toDateString())
                ->orderByDesc('id')
                ->first();
        }

        return null;
    }

    private function selectBestStudentNumberRecord(
        AlumniRegistrationAssistanceRequest $req,
        AlumniProfile $profile,
    ): ?AlumniStudentNumber {
        $records = AlumniStudentNumber::query()
            ->with(['alumniProfile.user:id,alumni_profile_id,username,email', 'programDegree.program:id,code,name'])
            ->where('alumni_profile_id', $profile->id)
            ->orderBy('id')
            ->get();

        if ($records->isEmpty()) {
            return null;
        }

        return $records->first(function (AlumniStudentNumber $rec) use ($req): bool {
            $programMatches = ! $req->academic_program_id || (int) $rec->programDegree?->program_id === (int) $req->academic_program_id;
            $yearMatches = ! $req->graduation_year || (int) $rec->graduation_year === (int) $req->graduation_year;

            return $programMatches && $yearMatches;
        }) ?? $records->first();
    }

    private function resolveAlumniProfile(
        AlumniRegistrationAssistanceRequest $req,
        string $resolutionAction,
        int $actorUserId,
    ): AlumniProfile {
        $normalizedSn = filled($req->student_number) ? Str::upper(trim((string) $req->student_number)) : '';
        $existingEdu = $normalizedSn !== ''
            ? AlumniStudentNumber::query()->with('alumniProfile')->where('student_number', $normalizedSn)->first()
            : null;

        if (filled($req->last_name) || filled($req->first_name)) {
            $firstName = trim((string) $req->first_name);
            $middleName = trim((string) $req->middle_name);
            $lastName = trim((string) $req->last_name);
        } else {
            [$firstName, $middleName, $lastName] = app(AlumniCredentialService::class)->parseFullName($req->name);
        }

        $profile = $existingEdu?->alumniProfile ?? $this->findMatchingProfile($req);

        if ($profile !== null) {
            if (in_array($resolutionAction, ['sync_record', 'provision_account'], true)) {
                $profile->forceFill([
                    'name' => $req->name,
                    'first_name' => $firstName !== '' ? $firstName : $profile->first_name,
                    'middle_name' => $middleName !== '' ? $middleName : $profile->middle_name,
                    'last_name' => $lastName !== '' ? $lastName : $profile->last_name,
                    'email' => $req->email,
                    'date_of_birth' => $req->date_of_birth->toDateString(),
                ])->save();
            }

            if ($normalizedSn !== '' && ! $profile->studentNumbers()->where('student_number', $normalizedSn)->exists()) {
                $programDegreeId = $this->resolveProgramDegreeId($req->academic_program_id);
                DB::table('alumni_education_records')->insert([
                    'alumni_profile_id' => $profile->id,
                    'student_number' => $normalizedSn,
                    'program_degree_id' => $programDegreeId,
                    'graduation_year' => $req->graduation_year,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            return $profile;
        }

        // Create official AlumniProfile + AlumniStudentNumber record
        $profile = AlumniProfile::create([
            'name' => $req->name,
            'first_name' => $firstName,
            'middle_name' => $middleName !== '' ? $middleName : null,
            'last_name' => $lastName,
            'email' => $req->email,
            'date_of_birth' => $req->date_of_birth->toDateString(),
            'profile_status' => 'active',
            'created_by_user_id' => $actorUserId,
        ]);

        $programDegreeId = $this->resolveProgramDegreeId($req->academic_program_id);
        $studentNumberToStore = $normalizedSn !== '' ? $normalizedSn : sprintf('REG-%05d', $req->id);

        DB::table('alumni_education_records')->insert([
            'alumni_profile_id' => $profile->id,
            'student_number' => $studentNumberToStore,
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
        bool $overwritePassword = false,
    ): User {
        $credentialService = app(AlumniCredentialService::class);
        $existingByProfile = User::query()->where('alumni_profile_id', $profile->id)->first();
        if ($existingByProfile) {
            $dirty = false;
            if (blank($existingByProfile->username)) {
                $existingByProfile->username = $credentialService->generateUniqueUsername(
                    $profile->first_name,
                    $profile->middle_name,
                    $profile->last_name,
                    $profile->name,
                    $existingByProfile->id,
                );
                $dirty = true;
            }
            if ($overwritePassword) {
                $existingByProfile->password = $rawPassword;
                $dirty = true;
            }
            if ($dirty) {
                $existingByProfile->save();
            }

            $alumniRole = Role::query()->firstOrCreate(
                ['name' => 'alumni'],
                ['label' => 'Alumni'],
            );
            $existingByProfile->roles()->syncWithoutDetaching([
                $alumniRole->id => ['created_at' => now()],
            ]);

            return $existingByProfile;
        }

        $user = User::query()->where('email', Str::lower(trim($email)))->first();
        if (! $user) {
            $user = new User([
                'name' => $name,
                'username' => $credentialService->generateUniqueUsername(
                    $profile->first_name,
                    $profile->middle_name,
                    $profile->last_name,
                    $profile->name,
                ),
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
                'username' => $user->username ?: $credentialService->generateUniqueUsername(
                    $profile->first_name,
                    $profile->middle_name,
                    $profile->last_name,
                    $profile->name,
                    $user->id,
                ),
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

    private function normalizeLastName(string $name): string
    {
        $parts = preg_split('/\s+/', trim($name)) ?: [];
        $last = $parts ? (string) end($parts) : $name;

        return Str::lower(trim($last));
    }
}
