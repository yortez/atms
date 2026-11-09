<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Employer;
use App\Models\Role;
use App\Notifications\EmployerVerificationUpdated;
use App\Services\ActivityLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class EmployerController extends Controller
{
    public function index(): JsonResponse
    {
        $this->authorize('viewAny', Employer::class);

        return response()->json([
            'data' => Employer::query()->with('reviewer:id,name')->latest()->paginate(25),
        ]);
    }

    public function mine(Request $request): JsonResponse
    {
        if ($request->user()->can('viewAny', Employer::class)) {
            return response()->json([
                'data' => Employer::query()
                    ->select(['id', 'company_name', 'industry', 'website', 'verification_status'])
                    ->orderBy('company_name')
                    ->get(),
            ]);
        }

        abort_unless($request->user()->hasRole('employer'), 403);

        return response()->json([
            'data' => Employer::query()
                ->whereHas('users', fn ($query) => $query->whereKey($request->user()->id))
                ->select(['id', 'company_name', 'industry', 'website', 'verification_status'])
                ->orderBy('company_name')
                ->get(),
        ]);
    }

    public function show(Employer $employer): JsonResponse
    {
        $this->authorize('view', $employer);

        return response()->json(['data' => $employer->load('users:id,name')]);
    }

    public function store(Request $request, ActivityLogger $activityLogger): JsonResponse
    {
        $this->authorize('create', Employer::class);

        $data = $request->validate([
            'company_name' => ['required', 'string', 'max:180'],
            'website' => ['nullable', 'url', 'max:255'],
            'description' => ['nullable', 'string', 'max:10000'],
            'industry' => ['nullable', 'string', 'max:120'],
            'registration_number' => ['nullable', 'string', 'max:100'],
            'contact_email' => ['required', 'email', 'max:255'],
            'contact_phone' => ['nullable', 'string', 'max:40'],
            'address' => ['nullable', 'string', 'max:5000'],
        ]);

        $employer = DB::transaction(function () use ($data, $request): Employer {
            $employer = Employer::create([
                ...$data,
                'verification_status' => 'pending',
            ]);
            $employer->users()->attach($request->user()->id, [
                'membership_role' => 'owner',
                'created_at' => now(),
            ]);

            $role = Role::query()->firstOrCreate(
                ['name' => 'employer'],
                ['label' => 'Employer'],
            );
            $request->user()->roles()->syncWithoutDetaching([
                $role->id => ['created_at' => now()],
            ]);

            return $employer;
        });
        $activityLogger->record('employer.registered', $employer, ['status' => 'pending']);

        return response()->json(['data' => $employer], 201);
    }

    public function update(Request $request, Employer $employer, ActivityLogger $activityLogger): JsonResponse
    {
        $this->authorize('update', $employer);

        $data = $request->validate([
            'company_name' => ['sometimes', 'required', 'string', 'max:180'],
            'website' => ['nullable', 'url', 'max:255'],
            'description' => ['nullable', 'string', 'max:10000'],
            'industry' => ['nullable', 'string', 'max:120'],
            'registration_number' => ['nullable', 'string', 'max:100'],
            'contact_email' => ['sometimes', 'required', 'email', 'max:255'],
            'contact_phone' => ['nullable', 'string', 'max:40'],
            'address' => ['nullable', 'string', 'max:5000'],
        ]);

        if ($employer->verification_status !== 'pending'
            && ! $request->user()->hasRole('system-administrator', 'alumni-coordinator')) {
            abort(403, 'Verified employer changes require administrative review.');
        }

        $employer->fill($data)->save();
        $activityLogger->record('employer.profile_updated', $employer, ['changed_fields' => array_keys($data)]);

        return response()->json(['data' => $employer->refresh()]);
    }

    public function review(Request $request, Employer $employer, ActivityLogger $activityLogger): JsonResponse
    {
        $this->authorize('review', Employer::class);

        $data = $request->validate([
            'verification_status' => ['required', Rule::in(['verified', 'rejected', 'suspended'])],
        ]);
        $employer->forceFill([
            ...$data,
            'verified_at' => $data['verification_status'] === 'verified' ? now() : null,
            'reviewed_by_user_id' => $request->user()->id,
        ])->save();
        $employer->users()->each(
            fn ($user) => $user->notify(new EmployerVerificationUpdated($employer->verification_status)),
        );
        $activityLogger->record('employer.verification_reviewed', $employer, [
            'status' => $employer->verification_status,
        ]);

        return response()->json(['data' => $employer]);
    }
}
