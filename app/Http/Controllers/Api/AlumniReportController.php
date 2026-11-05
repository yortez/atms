<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AlumniReportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AlumniReportController extends Controller
{
    public function employmentOutcomes(Request $request, AlumniReportService $reportService): JsonResponse
    {
        abort_unless(
            $request->user()->hasRole('system-administrator', 'alumni-coordinator', 'department-coordinator')
                || $request->user()->hasPermission('reports.view'),
            403,
        );

        $filters = $request->validate([
            'program_id' => ['nullable', 'integer', 'exists:academic_programs,id'],
            'graduation_year' => ['nullable', 'integer', 'between:1900,2100'],
        ]);

        return response()->json([
            'data' => $reportService->employmentOutcomes(
                $request->user(),
                isset($filters['program_id']) ? (int) $filters['program_id'] : null,
                isset($filters['graduation_year']) ? (int) $filters['graduation_year'] : null,
            ),
        ]);
    }
}
