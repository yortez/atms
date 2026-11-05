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
    public function index(): JsonResponse
    {
        $this->authorize('manageRegistrationAssistance');

        return response()->json([
            'data' => AlumniRegistrationAssistanceRequest::query()
                ->where('status', 'pending')
                ->latest()
                ->paginate(25),
        ]);
    }

    public function update(
        Request $request,
        AlumniRegistrationAssistanceRequest $assistanceRequest,
        ActivityLogger $activityLogger,
    ): JsonResponse {
        $this->authorize('manageRegistrationAssistance');

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
