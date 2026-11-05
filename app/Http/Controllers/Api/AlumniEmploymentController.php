<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AlumniProfile;
use App\Models\EmploymentStatus;
use App\Notifications\AlumniEmploymentReported;
use App\Services\ActivityLogger;
use App\Services\AlumniEmploymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AlumniEmploymentController extends Controller
{
    public function statuses(): JsonResponse
    {
        return response()->json([
            'data' => EmploymentStatus::query()->where('is_active', true)->orderBy('id')->get(['id', 'code', 'label']),
        ]);
    }

    public function index(AlumniProfile $profile): JsonResponse
    {
        $this->authorize('view', $profile);

        return response()->json([
            'data' => $profile->employmentRecords()->with('status')->latest('reported_at')->get(),
        ]);
    }

    public function store(
        Request $request,
        AlumniProfile $profile,
        AlumniEmploymentService $employmentService,
        ActivityLogger $activityLogger,
    ): JsonResponse {
        $this->authorize('update', $profile);

        $data = $request->validate([
            'employment_status_id' => [
                'required',
                'integer',
                Rule::exists('employment_statuses', 'id')->where('is_active', true),
            ],
            'employer_name' => ['nullable', 'string', 'max:180'],
            'job_title' => ['nullable', 'string', 'max:160'],
            'industry' => ['nullable', 'string', 'max:120'],
            'employment_type' => ['nullable', 'string', 'max:32'],
            'work_location' => ['nullable', 'string', 'max:180'],
            'started_on' => ['nullable', 'date_format:Y-m-d'],
            'ended_on' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:started_on'],
        ]);

        $record = $employmentService->report($profile, $request->user(), $data);
        $activityLogger->record('alumni.employment_reported', $record, [
            'status' => $record->status?->code,
        ]);
        $profile->user?->notify(new AlumniEmploymentReported($record->id));

        return response()->json(['data' => $record], 201);
    }
}
