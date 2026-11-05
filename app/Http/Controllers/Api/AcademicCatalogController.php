<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AcademicProgram;
use App\Models\Department;
use App\Models\ProgramDegree;
use App\Services\ActivityLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AcademicCatalogController extends Controller
{
    public function departments(): JsonResponse
    {
        return response()->json([
            'data' => Department::query()->where('is_active', true)->with('programs')->orderBy('name')->get(),
        ]);
    }

    public function programs(): JsonResponse
    {
        return response()->json([
            'data' => AcademicProgram::query()->where('is_active', true)->with(['department', 'programDegrees.degree'])->orderBy('name')->get(),
        ]);
    }

    public function storeDepartment(Request $request, ActivityLogger $activityLogger): JsonResponse
    {
        $this->authorize('manageAcademicCatalog');

        $data = $request->validate([
            'code' => ['required', 'string', 'max:32', 'unique:departments,code'],
            'name' => ['required', 'string', 'max:160'],
            'description' => ['nullable', 'string', 'max:10000'],
        ]);
        $department = Department::create($data);
        $activityLogger->record('academic.department_created', $department);

        return response()->json(['data' => $department], 201);
    }

    public function storeProgram(Request $request, Department $department, ActivityLogger $activityLogger): JsonResponse
    {
        $this->authorize('manageAcademicCatalog');

        $data = $request->validate([
            'code' => ['required', 'string', 'max:32'],
            'name' => ['required', 'string', 'max:180'],
            'description' => ['nullable', 'string', 'max:10000'],
        ]);

        $program = $department->programs()->create($data);
        $activityLogger->record('academic.program_created', $program);

        return response()->json(['data' => $program], 201);
    }

    public function storeProgramDegree(Request $request, AcademicProgram $program, ActivityLogger $activityLogger): JsonResponse
    {
        $this->authorize('manageAcademicCatalog');

        $data = $request->validate([
            'degree_id' => ['required', 'integer', 'exists:degrees,id'],
        ]);
        $offering = ProgramDegree::create([
            'program_id' => $program->id,
            'degree_id' => $data['degree_id'],
        ]);
        $activityLogger->record('academic.program_degree_created', $offering);

        return response()->json(['data' => $offering->load('degree')], 201);
    }
}
