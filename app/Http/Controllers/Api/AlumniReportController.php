<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AlumniReportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Validation\Rule;

class AlumniReportController extends Controller
{
    public function index(Request $request, AlumniReportService $reportService): JsonResponse
    {
        $this->authorizeReportAccess($request);

        $validated = $this->validateReportRequest($request, $reportService);
        $reportType = $validated['report_type'] ?? 'graduate_tracer_summary';

        return response()->json([
            'data' => $reportService->generateReport($request->user(), $reportType, $validated),
        ]);
    }

    public function employmentOutcomes(Request $request, AlumniReportService $reportService): JsonResponse
    {
        $this->authorizeReportAccess($request);

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

    public function exportExcel(Request $request, AlumniReportService $reportService): Response
    {
        $this->authorizeReportAccess($request);

        $validated = $this->validateReportRequest($request, $reportService);
        $reportType = $validated['report_type'] ?? 'graduate_tracer_summary';
        $report = $reportService->generateReport($request->user(), $reportType, $validated);
        $xml = $reportService->exportExcelXml($report);
        $filename = str_replace('_', '-', $reportType).'-'.now()->format('Y-m-d').'.xls';

        return response($xml, 200, [
            'Content-Type' => 'application/vnd.ms-excel; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="'.$filename.'"',
            'Cache-Control' => 'no-store, no-cache, must-revalidate',
        ]);
    }

    public function exportPdf(Request $request, AlumniReportService $reportService): Response
    {
        $this->authorizeReportAccess($request);

        $validated = $this->validateReportRequest($request, $reportService);
        $reportType = $validated['report_type'] ?? 'graduate_tracer_summary';
        $report = $reportService->generateReport($request->user(), $reportType, $validated);
        $pdf = $reportService->exportPdfDocument($report);
        $filename = str_replace('_', '-', $reportType).'-'.now()->format('Y-m-d').'.pdf';

        return response($pdf, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="'.$filename.'"',
            'Cache-Control' => 'no-store, no-cache, must-revalidate',
        ]);
    }

    private function authorizeReportAccess(Request $request): void
    {
        abort_unless(
            $request->user()->hasRole('system-administrator', 'alumni-coordinator', 'department-coordinator')
                || $request->user()->hasPermission('reports.view'),
            403,
        );
    }

    /**
     * @return array<string, mixed>
     */
    private function validateReportRequest(Request $request, AlumniReportService $reportService): array
    {
        return $request->validate([
            'report_type' => ['nullable', 'string', Rule::in(array_keys($reportService->reportCatalog()))],
            'department_id' => ['nullable', 'integer', 'exists:departments,id'],
            'program_id' => ['nullable', 'integer', 'exists:academic_programs,id'],
            'graduation_year' => ['nullable', 'integer', 'between:1900,2100'],
            'employment_status' => ['nullable', 'string', 'max:100'],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date', 'after_or_equal:date_from'],
        ]);
    }
}
