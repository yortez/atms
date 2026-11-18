<?php

namespace App\Http\Controllers;

use App\Models\AcademicProgram;
use App\Models\AlumniProfile;
use App\Models\AlumniRegistrationAssistanceRequest;
use App\Models\AlumniStudentNumber;
use App\Services\AlumniCredentialService;
use App\Services\AlumniRegistrationLogger;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class AlumniRegistrationAssistanceController extends Controller
{
    public function create(Request $request): Response
    {
        $programs = AcademicProgram::query()
            ->where('is_active', true)
            ->with('department:id,code,name')
            ->orderBy('name')
            ->get(['id', 'department_id', 'code', 'name'])
            ->map(fn (AcademicProgram $prog) => [
                'id' => $prog->id,
                'code' => $prog->code,
                'name' => $prog->name,
                'department_code' => $prog->department?->code,
            ])
            ->values();

        $lookupResult = null;
        $lookupError = null;

        if ($request->filled('lookup_reference') && $request->filled('lookup_identifier')) {
            $refId = (int) preg_replace('/\D/', '', (string) $request->query('lookup_reference'));
            $identifier = Str::lower(trim((string) $request->query('lookup_identifier')));

            $found = AlumniRegistrationAssistanceRequest::query()
                ->with(['program:id,code,name', 'reviewedBy:id,name', 'resolvedProfile.user:id,alumni_profile_id,username'])
                ->whereKey($refId)
                ->first();

            if (
                $found
                && (
                    Str::lower($found->email) === $identifier
                    || (filled($found->student_number) && Str::lower($found->student_number) === $identifier)
                )
            ) {
                $deliveryMethod = $found->credential_delivery_method ?? 'both';
                $canShowCredentialsInStatus = $found->status === 'reviewed'
                    && in_array($deliveryMethod, ['status', 'both'], true);

                $username = $found->released_username ?? $found->resolvedProfile?->user?->username;
                if ($username === null && filled($found->student_number)) {
                    $username = AlumniStudentNumber::query()
                        ->with('alumniProfile.user:id,alumni_profile_id,username')
                        ->where('student_number', Str::upper(trim((string) $found->student_number)))
                        ->first()
                        ?->alumniProfile
                        ?->user
                        ?->username;
                }

                $lookupResult = [
                    'id' => $found->id,
                    'name' => $found->name,
                    'first_name' => $found->first_name,
                    'middle_name' => $found->middle_name,
                    'last_name' => $found->last_name,
                    'student_number' => $found->student_number,
                    'credential_delivery_method' => $found->credential_delivery_method,
                    'username' => $canShowCredentialsInStatus ? $username : null,
                    'password' => $canShowCredentialsInStatus ? $found->released_password : null,
                    'program' => $found->program ? "{$found->program->code} · {$found->program->name}" : null,
                    'graduation_year' => $found->graduation_year,
                    'status' => $found->status,
                    'review_note' => $found->review_note,
                    'resolution_action' => $found->resolution_action,
                    'reviewed_at' => $found->reviewed_at?->toDateTimeString(),
                    'created_at' => $found->created_at?->toDateTimeString(),
                ];
            } else {
                $lookupError = 'No matching assistance request was found for that Reference ID and Email / Student Number.';
            }
        }

        return Inertia::render('auth/registration-assistance', [
            'status' => $request->session()->get('status'),
            'reference' => $request->session()->get('reference'),
            'programs' => $programs,
            'lookupResult' => $lookupResult,
            'lookupError' => $lookupError,
        ]);
    }

    public function store(Request $request, AlumniRegistrationLogger $logger): RedirectResponse
    {
        $usesStructuredName = $request->filled('last_name') || $request->filled('first_name');

        if ($usesStructuredName) {
            $validated = $request->validate([
                'last_name' => ['required', 'string', 'max:100'],
                'first_name' => ['required', 'string', 'max:100'],
                'middle_name' => ['nullable', 'string', 'max:100'],
                'academic_program_id' => ['required', 'integer', 'exists:academic_programs,id'],
                'graduation_year' => ['required', 'integer', 'min:1950', 'max:2100'],
                'date_of_birth' => ['required', 'date_format:Y-m-d'],
                'email' => ['required', 'string', 'email', 'max:255'],
                'student_number' => ['nullable', 'string', 'max:255'],
                'message' => ['nullable', 'string', 'max:1000'],
            ]);

            $firstName = trim((string) $validated['first_name']);
            $middleName = isset($validated['middle_name']) ? trim((string) $validated['middle_name']) : '';
            $lastName = trim((string) $validated['last_name']);
            $fullName = trim($firstName . ' ' . ($middleName !== '' ? $middleName . ' ' : '') . $lastName);

            $validated['name'] = $fullName;
            $validated['first_name'] = $firstName;
            $validated['middle_name'] = $middleName !== '' ? $middleName : null;
            $validated['last_name'] = $lastName;
        } else {
            $validated = $request->validate([
                'name' => ['required', 'string', 'max:255'],
                'email' => ['required', 'string', 'email', 'max:255'],
                'date_of_birth' => ['required', 'date_format:Y-m-d'],
                'student_number' => ['nullable', 'string', 'max:255'],
                'academic_program_id' => ['nullable', 'integer', 'exists:academic_programs,id'],
                'graduation_year' => ['nullable', 'integer', 'min:1950', 'max:2100'],
                'message' => ['nullable', 'string', 'max:1000'],
            ]);

            $validated['name'] = trim((string) $validated['name']);
            [$firstName, $middleName, $lastName] = app(AlumniCredentialService::class)->parseFullName($validated['name']);
            $validated['first_name'] = $firstName !== '' ? $firstName : null;
            $validated['middle_name'] = $middleName !== '' ? $middleName : null;
            $validated['last_name'] = $lastName !== '' ? $lastName : null;
        }

        $validated['email'] = Str::lower(trim((string) $validated['email']));
        $validated['student_number'] = ! empty($validated['student_number'])
            ? Str::upper(trim((string) $validated['student_number']))
            : null;

        if ($validated['student_number'] === null && ! empty($validated['first_name']) && ! empty($validated['last_name'])) {
            $matchedProfile = AlumniProfile::query()
                ->with(['educationRecords.programDegree'])
                ->whereRaw('LOWER(last_name) = ?', [Str::lower($validated['last_name'])])
                ->whereRaw('LOWER(first_name) = ?', [Str::lower($validated['first_name'])])
                ->whereDate('date_of_birth', $validated['date_of_birth'])
                ->first();

            $firstEdu = $matchedProfile?->educationRecords->first();
            if ($firstEdu !== null) {
                $validated['student_number'] = Str::upper(trim((string) $firstEdu->student_number));
                if (empty($validated['academic_program_id'])) {
                    $validated['academic_program_id'] = $firstEdu->programDegree?->program_id;
                }
            }
        } elseif (empty($validated['academic_program_id']) && $validated['student_number'] !== null) {
            $existing = AlumniStudentNumber::with('programDegree')
                ->where('student_number', $validated['student_number'])
                ->first();
            $validated['academic_program_id'] = $existing?->programDegree?->program_id;
        }

        $assistanceRequest = DB::transaction(function () use ($validated, $logger) {
            $assistanceRequest = AlumniRegistrationAssistanceRequest::create($validated);
            $logger->record('assistance_requested', $validated['student_number'] ?? $validated['email']);

            return $assistanceRequest;
        });

        return to_route('alumni.registration-assistance.create')
            ->with('status', 'Your request has been submitted for administrative review.')
            ->with('reference', (string) $assistanceRequest->getKey());
    }
}
