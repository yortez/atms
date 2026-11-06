<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AlumniRegistrationAssistanceRequest;
use App\Services\ActivityLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class RegistrationAssistanceController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->authorize('manageRegistrationAssistance');

        $query = AlumniRegistrationAssistanceRequest::query()
            ->with('program')
            ->where('status', 'pending');

        if ($request->user()->hasRole('department-coordinator') && ! $request->user()->hasRole('system-administrator', 'alumni-coordinator')) {
            $assignedProgramIds = $request->user()->assignedPrograms()->pluck('academic_programs.id');
            $query->where(function ($q) use ($assignedProgramIds) {
                $q->whereIn('academic_program_id', $assignedProgramIds)
                    ->orWhereNull('academic_program_id');
            });
        }

        return response()->json([
            'data' => $query->latest()->paginate(25),
        ]);
    }

    public function update(
        Request $request,
        AlumniRegistrationAssistanceRequest $assistanceRequest,
        ActivityLogger $activityLogger,
    ): JsonResponse {
        $this->authorize('manageRegistrationAssistance');

        if ($request->user()->hasRole('department-coordinator') && ! $request->user()->hasRole('system-administrator', 'alumni-coordinator')) {
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
        ]);
        $assistanceRequest->forceFill([
            'status' => $data['status'],
            'reviewed_by_user_id' => $request->user()->id,
            'reviewed_at' => now(),
            'review_note' => $data['review_note'] ?? null,
        ])->save();
        $activityLogger->record('alumni.registration_assistance_reviewed', $assistanceRequest, [
            'status' => $data['status'],
        ]);

        return response()->json(['data' => [
            'id' => $assistanceRequest->id,
            'status' => $assistanceRequest->status,
        ]]);
    }
}
