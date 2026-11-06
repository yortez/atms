<?php

namespace App\Http\Controllers;

use App\Models\AcademicProgram;
use App\Models\AlumniRegistrationAssistanceRequest;
use App\Models\AlumniStudentNumber;
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
                ->with(['program:id,code,name', 'reviewedBy:id,name'])
                ->whereKey($refId)
                ->first();

            if (
                $found
                && (Str::lower($found->email) === $identifier || Str::lower($found->student_number) === $identifier)
            ) {
                $lookupResult = [
                    'id' => $found->id,
                    'name' => $found->name,
                    'student_number' => $found->student_number,
                    'program' => $found->program ? "{$found->program->code} · {$found->program->name}" : null,
                    'status' => $found->status,
                    'review_note' => $found->review_note,
                    'resolution_action' => $found->resolution_action,
                    'reviewed_at' => $found->reviewed_at?->toDateTimeString(),
                    'created_at' => $found->created_at?->toDateTimeString(),
                ];
            } else {
                $lookupError = 'No matching assistance request was found for that Reference ID and Student Number / Email.';
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
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255'],
            'date_of_birth' => ['required', 'date_format:Y-m-d'],
            'student_number' => ['required', 'string', 'max:255'],
            'academic_program_id' => ['nullable', 'integer', 'exists:academic_programs,id'],
            'graduation_year' => ['nullable', 'integer', 'min:1950', 'max:2100'],
            'message' => ['nullable', 'string', 'max:1000'],
        ]);

        $validated['name'] = trim($validated['name']);
        $validated['email'] = Str::lower(trim($validated['email']));
        $validated['student_number'] = Str::upper(trim($validated['student_number']));

        if (empty($validated['academic_program_id'])) {
            $existing = AlumniStudentNumber::with('programDegree')
                ->where('student_number', $validated['student_number'])
                ->first();
            $validated['academic_program_id'] = $existing?->programDegree?->program_id;
        }

        $assistanceRequest = DB::transaction(function () use ($validated, $logger) {
            $assistanceRequest = AlumniRegistrationAssistanceRequest::create($validated);
            $logger->record('assistance_requested', $validated['student_number']);

            return $assistanceRequest;
        });

        return to_route('alumni.registration-assistance.create')
            ->with('status', 'Your request has been submitted for administrative review.')
            ->with('reference', (string) $assistanceRequest->getKey());
    }
}
