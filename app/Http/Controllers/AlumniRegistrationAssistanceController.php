<?php

namespace App\Http\Controllers;

use App\Models\AlumniRegistrationAssistanceRequest;
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
        return Inertia::render('auth/registration-assistance', [
            'status' => $request->session()->get('status'),
            'reference' => $request->session()->get('reference'),
        ]);
    }

    public function store(Request $request, AlumniRegistrationLogger $logger): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255'],
            'date_of_birth' => ['required', 'date_format:Y-m-d'],
            'student_number' => ['required', 'string', 'max:255'],
            'message' => ['nullable', 'string', 'max:1000'],
        ]);

        $validated['name'] = trim($validated['name']);
        $validated['email'] = Str::lower(trim($validated['email']));
        $validated['student_number'] = Str::upper(trim($validated['student_number']));

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
