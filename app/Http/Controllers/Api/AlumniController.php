<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\AlumniProfileResource;
use App\Models\AlumniProfile;
use App\Services\ActivityLogger;
use App\Services\AlumniImportService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Validation\Rule;

class AlumniController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', AlumniProfile::class);

        $query = AlumniProfile::query()
            ->where('profile_status', 'active')
            ->with([
                'educationRecords.programDegree.program',
                'educationRecords.programDegree.degree',
                'employmentRecords.status',
                'user:id,alumni_profile_id,created_at',
            ]);

        if ($request->filled('claim_status')) {
            $request->validate(['claim_status' => [Rule::in(['claimed', 'unclaimed'])]]);
            $request->query('claim_status') === 'claimed'
                ? $query->whereHas('user')
                : $query->whereDoesntHave('user');
        }

        if ($request->user()->hasRole('department-coordinator') && ! $request->user()->hasRole('system-administrator', 'alumni-coordinator')) {
            $programIds = $request->user()->assignedPrograms()->select('academic_programs.id');
            $query->whereHas('educationRecords.programDegree', fn (Builder $programDegree) => $programDegree
                ->whereIn('program_id', $programIds));
        }

        if ($search = trim((string) $request->query('search'))) {
            $query->where(function (Builder $searchQuery) use ($search): void {
                $searchQuery
                    ->where('name', 'like', "%{$search}%")
                    ->orWhere('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhereHas('educationRecords', fn (Builder $records) => $records
                        ->where('student_number', 'like', "%{$search}%"));
            });
        }

        if ($request->filled('program_id')) {
            $request->validate(['program_id' => ['integer', 'exists:academic_programs,id']]);
            $query->whereHas('educationRecords.programDegree', fn (Builder $programDegree) => $programDegree
                ->where('program_id', $request->integer('program_id')));
        }

        if ($request->filled('graduation_year')) {
            $request->validate(['graduation_year' => ['integer', 'between:1900,2100']]);
            $query->whereHas('educationRecords', fn (Builder $records) => $records
                ->where('graduation_year', $request->integer('graduation_year')));
        }

        return AlumniProfileResource::collection($query->orderBy('last_name')->paginate(25))
            ->response();
    }

    public function show(AlumniProfile $profile): AlumniProfileResource
    {
        $this->authorize('view', $profile);

        return new AlumniProfileResource($profile->load([
            'educationRecords.programDegree.program',
            'educationRecords.programDegree.degree',
            'employmentRecords.status',
            'user:id,alumni_profile_id,created_at',
        ]));
    }

    public function me(Request $request): AlumniProfileResource|JsonResponse
    {
        $profile = $request->user()->alumniProfile;

        if ($profile === null) {
            return response()->json(['message' => 'This account is not linked to an alumni profile.'], 404);
        }

        $this->authorize('view', $profile);

        return new AlumniProfileResource($profile->load([
            'educationRecords.programDegree.program',
            'educationRecords.programDegree.degree',
            'employmentRecords.status',
        ]));
    }

    public function store(Request $request, ActivityLogger $activityLogger): JsonResponse
    {
        $this->authorize('create', AlumniProfile::class);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'date_of_birth' => ['required', 'date_format:Y-m-d'],
            'first_name' => ['required', 'string', 'max:100'],
            'middle_name' => ['nullable', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'suffix' => ['nullable', 'string', 'max:30'],
            'preferred_name' => ['nullable', 'string', 'max:100'],
        ]);

        $profile = AlumniProfile::create([
            ...$data,
            'email' => mb_strtolower(trim($data['email'])),
            'created_by_user_id' => $request->user()->id,
        ]);
        $activityLogger->record('alumni.profile_created', $profile);

        return (new AlumniProfileResource($profile))->response()->setStatusCode(201);
    }

    public function update(Request $request, AlumniProfile $profile, ActivityLogger $activityLogger): AlumniProfileResource
    {
        $this->authorize('update', $profile);

        $isSelf = $request->user()->alumni_profile_id === $profile->id;
        $rules = $isSelf
            ? ['preferred_name' => ['nullable', 'string', 'max:100']]
            : [
                'name' => ['sometimes', 'required', 'string', 'max:255'],
                'email' => ['sometimes', 'required', 'email', 'max:255'],
                'date_of_birth' => ['sometimes', 'required', 'date_format:Y-m-d'],
                'first_name' => ['sometimes', 'required', 'string', 'max:100'],
                'middle_name' => ['nullable', 'string', 'max:100'],
                'last_name' => ['sometimes', 'required', 'string', 'max:100'],
                'suffix' => ['nullable', 'string', 'max:30'],
                'preferred_name' => ['nullable', 'string', 'max:100'],
                'profile_status' => ['sometimes', Rule::in(['active', 'archived'])],
            ];
        $data = $request->validate($rules);

        if (isset($data['email'])) {
            $data['email'] = mb_strtolower(trim($data['email']));
        }

        $profile->fill($data)->save();
        $activityLogger->record('alumni.profile_updated', $profile, ['changed_fields' => array_keys($data)]);

        return new AlumniProfileResource($profile->refresh());
    }

    public function storeEducationRecord(Request $request, AlumniProfile $profile, ActivityLogger $activityLogger): JsonResponse
    {
        $this->authorize('create', AlumniProfile::class);

        $data = $request->validate([
            'student_number' => ['required', 'string', 'max:64', 'unique:alumni_education_records,student_number'],
            'program_degree_id' => ['required', 'integer', 'exists:program_degrees,id'],
            'graduation_year' => ['required', 'integer', 'between:1900,2100'],
            'honors' => ['nullable', 'string', 'max:120'],
        ]);

        $record = $profile->educationRecords()->create($data);
        $activityLogger->record('alumni.education_record_created', $record, [
            'graduation_year' => (int) $data['graduation_year'],
        ]);

        return response()->json([
            'data' => [
                'id' => $record->id,
                'student_number' => $record->student_number,
                'graduation_year' => $record->graduation_year,
                'program_degree_id' => $record->program_degree_id,
            ],
        ], 201);
    }

    public function import(Request $request, AlumniImportService $importService, ActivityLogger $activityLogger): JsonResponse
    {
        $this->authorize('import', AlumniProfile::class);

        $request->validate([
            'file' => ['required', 'file', 'mimes:csv,txt', 'max:20480'],
        ]);

        $stats = $importService->importFile($request->file('file'), $request->user());

        $activityLogger->record('alumni.batch_imported', null, [
            'total' => $stats['total'],
            'successful' => $stats['successful'],
            'failed' => $stats['failed'],
            'profiles_created' => $stats['profiles_created'],
        ]);

        return response()->json([
            'message' => "Import complete. {$stats['successful']} of {$stats['total']} records processed successfully.",
            'data' => $stats,
        ]);
    }

    public function importTemplate(AlumniImportService $importService): Response
    {
        $this->authorize('import', AlumniProfile::class);

        $csv = $importService->generateCsvTemplate();

        return response($csv, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="alumni_import_template.csv"',
        ]);
    }
}
