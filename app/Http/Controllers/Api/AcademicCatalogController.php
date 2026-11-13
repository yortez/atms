<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AcademicProgram;
use App\Models\Degree;
use App\Models\Department;
use App\Models\ProgramDegree;
use App\Services\ActivityLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use RuntimeException;
use Throwable;

class AcademicCatalogController extends Controller
{
    public function departments(): JsonResponse
    {
        return response()->json([
            'data' => Department::query()
                ->where('is_active', true)
                ->with(['programs.programDegrees.degree'])
                ->withCount('programs')
                ->orderBy('name')
                ->get(),
        ]);
    }

    public function programs(): JsonResponse
    {
        return response()->json([
            'data' => AcademicProgram::query()
                ->where('is_active', true)
                ->with(['department', 'programDegrees.degree'])
                ->orderBy('name')
                ->get(),
        ]);
    }

    public function storeDepartment(Request $request, ActivityLogger $activityLogger): JsonResponse
    {
        $this->authorize('manageAcademicCatalog');

        $data = $request->validate([
            'code' => ['required', 'string', 'max:32', 'unique:departments,code'],
            'name' => ['required', 'string', 'max:160'],
            'description' => ['nullable', 'string', 'max:10000'],
            'logo' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ]);

        $logoFile = $request->file('logo');
        $newLogoPath = $logoFile?->storePublicly('department-logos', 'public');
        if ($logoFile !== null && ! is_string($newLogoPath)) {
            throw new RuntimeException('The department logo could not be uploaded.');
        }

        try {
            $department = Department::create([
                'code' => strtoupper(trim($data['code'])),
                'name' => trim($data['name']),
                'description' => $data['description'] ?? null,
                'logo_path' => is_string($newLogoPath) ? $newLogoPath : null,
                'is_active' => true,
            ]);
        } catch (Throwable $exception) {
            if (is_string($newLogoPath) && ! Storage::disk('public')->delete($newLogoPath)) {
                report(new RuntimeException('The newly uploaded department logo could not be removed after creation failed.'));
            }

            throw $exception;
        }

        $activityLogger->record('academic.department_created', $department);

        return response()->json([
            'data' => $department->load('programs.programDegrees.degree')->loadCount('programs'),
        ], 201);
    }

    public function updateDepartment(
        Request $request,
        Department $department,
        ActivityLogger $activityLogger,
    ): JsonResponse {
        $this->authorize('manageAcademicCatalog');

        $data = $request->validate([
            'code' => [
                'sometimes',
                'required',
                'string',
                'max:32',
                Rule::unique('departments', 'code')->ignore($department->id),
            ],
            'name' => ['sometimes', 'required', 'string', 'max:160'],
            'description' => ['nullable', 'string', 'max:10000'],
            'is_active' => ['sometimes', 'boolean'],
            'logo' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'remove_logo' => ['sometimes', 'boolean'],
        ]);

        $removeLogo = $request->boolean('remove_logo');
        unset($data['logo'], $data['remove_logo']);

        $logoFile = $request->file('logo');
        $newLogoPath = $logoFile?->storePublicly('department-logos', 'public');
        if ($logoFile !== null && ! is_string($newLogoPath)) {
            throw new RuntimeException('The department logo could not be uploaded.');
        }

        $oldLogoPath = $department->logo_path;

        if (isset($data['code'])) {
            $data['code'] = strtoupper(trim($data['code']));
        }
        if (isset($data['name'])) {
            $data['name'] = trim($data['name']);
        }

        try {
            $department->fill($data);

            if (is_string($newLogoPath)) {
                $department->logo_path = $newLogoPath;
            } elseif ($removeLogo) {
                $department->logo_path = null;
            }

            $department->save();
        } catch (Throwable $exception) {
            if (is_string($newLogoPath) && ! Storage::disk('public')->delete($newLogoPath)) {
                report(new RuntimeException('The newly uploaded department logo could not be removed after update failed.'));
            }

            throw $exception;
        }

        if (
            (is_string($newLogoPath) || $removeLogo)
            && is_string($oldLogoPath)
            && ! Storage::disk('public')->delete($oldLogoPath)
        ) {
            report(new RuntimeException('The previous department logo could not be removed after replacement.'));
        }

        $activityLogger->record('academic.department_updated', $department);

        return response()->json([
            'data' => $department->fresh(['programs.programDegrees.degree'])->loadCount('programs'),
        ]);
    }

    public function storeProgram(Request $request, Department $department, ActivityLogger $activityLogger): JsonResponse
    {
        $this->authorize('manageAcademicCatalog');

        $data = $request->validate([
            'code' => ['required', 'string', 'max:32'],
            'name' => ['required', 'string', 'max:180'],
            'description' => ['nullable', 'string', 'max:10000'],
            'degree_title' => ['nullable', 'string', 'max:180'],
            'degree_level' => ['nullable', 'string', 'max:60'],
        ]);

        $program = $department->programs()->create([
            'code' => strtoupper(trim($data['code'])),
            'name' => trim($data['name']),
            'description' => $data['description'] ?? null,
            'is_active' => true,
        ]);

        if (filled($data['degree_title'] ?? null)) {
            $degreeCode = 'DEG-' . strtoupper(trim($data['code']));
            $degree = Degree::query()->firstOrCreate(
                ['code' => $degreeCode],
                [
                    'title' => trim((string) $data['degree_title']),
                    'degree_level' => $data['degree_level'] ?? 'bachelor',
                ],
            );
            ProgramDegree::query()->firstOrCreate([
                'program_id' => $program->id,
                'degree_id' => $degree->id,
            ]);
        }

        $activityLogger->record('academic.program_created', $program);

        return response()->json([
            'data' => $program->load(['department', 'programDegrees.degree']),
        ], 201);
    }

    public function updateProgram(
        Request $request,
        AcademicProgram $program,
        ActivityLogger $activityLogger,
    ): JsonResponse {
        $this->authorize('manageAcademicCatalog');

        $data = $request->validate([
            'department_id' => ['sometimes', 'required', 'integer', 'exists:departments,id'],
            'code' => ['sometimes', 'required', 'string', 'max:32'],
            'name' => ['sometimes', 'required', 'string', 'max:180'],
            'description' => ['nullable', 'string', 'max:10000'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        if (isset($data['code'])) {
            $data['code'] = strtoupper(trim($data['code']));
        }
        if (isset($data['name'])) {
            $data['name'] = trim($data['name']);
        }

        $program->fill($data)->save();
        $activityLogger->record('academic.program_updated', $program);

        return response()->json([
            'data' => $program->fresh(['department', 'programDegrees.degree']),
        ]);
    }

    public function storeProgramDegree(Request $request, AcademicProgram $program, ActivityLogger $activityLogger): JsonResponse
    {
        $this->authorize('manageAcademicCatalog');

        if ($request->filled('degree_id')) {
            $data = $request->validate([
                'degree_id' => ['required', 'integer', 'exists:degrees,id'],
            ]);
            $degreeId = (int) $data['degree_id'];
        } else {
            $data = $request->validate([
                'degree_code' => ['nullable', 'string', 'max:32'],
                'degree_title' => ['required', 'string', 'max:180'],
                'degree_level' => ['nullable', 'string', 'max:60'],
            ]);
            $code = strtoupper(trim($data['degree_code'] ?? ('DEG-' . $program->code . '-' . substr(md5($data['degree_title']), 0, 4))));
            $degree = Degree::query()->firstOrCreate(
                ['code' => $code],
                [
                    'title' => trim($data['degree_title']),
                    'degree_level' => $data['degree_level'] ?? 'bachelor',
                ],
            );
            $degreeId = $degree->id;
        }

        $offering = ProgramDegree::query()->firstOrCreate([
            'program_id' => $program->id,
            'degree_id' => $degreeId,
        ]);
        $activityLogger->record('academic.program_degree_created', $offering);

        return response()->json(['data' => $offering->load('degree')], 201);
    }
}
