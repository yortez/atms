<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AcademicProgram;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use App\Services\ActivityLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class SystemAdminUserController extends Controller
{
    /**
     * List all users, their assigned roles, academic program assignments, and role/permission catalogs.
     */
    public function index(): JsonResponse
    {
        $this->authorizeSystemAdministrator();

        $users = User::query()
            ->with(['roles:id,name', 'assignedPrograms:id,code,name'])
            ->orderBy('name')
            ->get()
            ->map(fn (User $user): array => $this->formatUserPayload($user));

        $rolesCatalog = Role::query()
            ->with('permissions:id,name,label')
            ->orderBy('id')
            ->get()
            ->map(fn (Role $role): array => [
                'id' => $role->id,
                'name' => $role->name,
                'label' => $role->label,
                'permissions' => $role->permissions->pluck('name')->values()->all(),
            ]);

        $permissionsCatalog = Permission::query()
            ->orderBy('name')
            ->get(['id', 'name', 'label']);

        $programsCatalog = AcademicProgram::query()
            ->with('department:id,code,name')
            ->orderBy('code')
            ->get(['id', 'department_id', 'code', 'name']);

        return response()->json([
            'data' => $users,
            'meta' => [
                'roles_catalog' => $rolesCatalog,
                'permissions_catalog' => $permissionsCatalog,
                'programs_catalog' => $programsCatalog,
            ],
        ]);
    }

    /**
     * Create an account and either send a password setup link or set an initial password directly.
     */
    public function invite(Request $request, ActivityLogger $activityLogger): JsonResponse
    {
        $administrator = $this->authorizeSystemAdministrator();

        $availableRoles = [
            'alumni-coordinator',
            'department-coordinator',
            'alumni',
            'employer',
        ];

        if (is_string($request->input('email'))) {
            $request->merge(['email' => Str::lower(trim($request->input('email')))]);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'roles' => ['required', 'array', 'min:1'],
            'roles.*' => ['required', 'string', 'distinct', Rule::in($availableRoles)],
            'password' => ['nullable', 'string', 'min:8', 'max:255'],
            'assigned_program_ids' => ['nullable', 'array'],
            'assigned_program_ids.*' => ['integer', 'exists:academic_programs,id'],
        ]);

        $hasDirectPassword = filled($validated['password'] ?? null);

        $user = DB::transaction(function () use ($validated, $administrator, $hasDirectPassword): User {
            $user = new User([
                'name' => trim($validated['name']),
                'email' => $validated['email'],
                'password' => $hasDirectPassword ? (string) $validated['password'] : Str::random(48),
            ]);

            if ($hasDirectPassword) {
                $user->email_verified_at = now();
            }

            $user->save();

            foreach ($validated['roles'] as $roleName) {
                Role::query()->firstOrCreate(
                    ['name' => $roleName],
                    ['label' => Str::headline($roleName)],
                );
            }

            $roleIds = Role::query()->whereIn('name', $validated['roles'])->pluck('id');
            $user->roles()->sync($roleIds->mapWithKeys(fn (int $roleId): array => [
                $roleId => [
                    'assigned_by_user_id' => $administrator->id,
                    'created_at' => now(),
                ],
            ]));

            if (
                in_array('department-coordinator', $validated['roles'], true)
                && ! empty($validated['assigned_program_ids'])
            ) {
                $programIds = collect($validated['assigned_program_ids'])->map(fn ($id) => (int) $id)->unique();
                $user->assignedPrograms()->sync($programIds->mapWithKeys(fn (int $programId): array => [
                    $programId => [
                        'assigned_by_user_id' => $administrator->id,
                        'created_at' => now(),
                    ],
                ]));
            }

            if (! $hasDirectPassword) {
                $status = Password::sendResetLink(['email' => $user->email]);
                if ($status !== Password::RESET_LINK_SENT) {
                    throw ValidationException::withMessages([
                        'email' => [trans($status)],
                    ]);
                }
            }

            return $user;
        });

        $activityLogger->record('user.invited', $user, [
            'roles' => $validated['roles'],
            'assigned_program_ids' => $validated['assigned_program_ids'] ?? [],
            'mode' => $hasDirectPassword ? 'direct' : 'invite',
        ]);

        $freshUser = $user->fresh(['roles:id,name', 'assignedPrograms:id,code,name']);

        return response()->json([
            'data' => $this->formatUserPayload($freshUser),
            'message' => $hasDirectPassword ? 'User account created.' : 'Invitation sent.',
        ], 201);
    }

    /**
     * Update the roles (and optional program scope) assigned to a user.
     */
    public function updateRoles(User $user, Request $request, ActivityLogger $activityLogger): JsonResponse
    {
        $administrator = $this->authorizeSystemAdministrator();
        $this->ensureUserCanBeManaged($user, $administrator);

        $availableRoles = [
            'alumni-coordinator',
            'department-coordinator',
            'alumni',
            'employer',
        ];

        $validated = $request->validate([
            'roles' => ['array'],
            'roles.*' => ['string', Rule::in($availableRoles)],
            'assigned_program_ids' => ['sometimes', 'nullable', 'array'],
            'assigned_program_ids.*' => ['integer', 'exists:academic_programs,id'],
        ]);

        foreach ($availableRoles as $roleName) {
            Role::query()->firstOrCreate(
                ['name' => $roleName],
                ['label' => Str::headline($roleName)],
            );
        }

        $nextRoles = $validated['roles'] ?? [];
        $roleIds = Role::query()->whereIn('name', $nextRoles)->pluck('id');
        $user->roles()->sync($roleIds->mapWithKeys(fn (int $roleId): array => [
            $roleId => [
                'assigned_by_user_id' => $administrator->id,
                'created_at' => now(),
            ],
        ]));

        if (! in_array('department-coordinator', $nextRoles, true)) {
            $user->assignedPrograms()->detach();
        } elseif (array_key_exists('assigned_program_ids', $validated)) {
            $programIds = collect($validated['assigned_program_ids'] ?? [])->map(fn ($id) => (int) $id)->unique();
            $user->assignedPrograms()->sync($programIds->mapWithKeys(fn (int $programId): array => [
                $programId => [
                    'assigned_by_user_id' => $administrator->id,
                    'created_at' => now(),
                ],
            ]));
        }

        $activityLogger->record('user.roles_updated', $user, [
            'roles' => $nextRoles,
        ]);

        $freshUser = $user->fresh(['roles:id,name', 'assignedPrograms:id,code,name']);

        return response()->json([
            'data' => $this->formatUserPayload($freshUser),
        ]);
    }

    /**
     * Update the academic programs assigned to a Department Coordinator.
     */
    public function updatePrograms(User $user, Request $request, ActivityLogger $activityLogger): JsonResponse
    {
        $administrator = $this->authorizeSystemAdministrator();

        if (! $user->hasRole('department-coordinator')) {
            throw ValidationException::withMessages([
                'assigned_program_ids' => ['Academic programs can only be assigned to users with the Department Coordinator role.'],
            ]);
        }

        $validated = $request->validate([
            'assigned_program_ids' => ['present', 'array'],
            'assigned_program_ids.*' => ['integer', 'exists:academic_programs,id'],
        ]);

        $programIds = collect($validated['assigned_program_ids'])->map(fn ($id) => (int) $id)->unique();
        $user->assignedPrograms()->sync($programIds->mapWithKeys(fn (int $programId): array => [
            $programId => [
                'assigned_by_user_id' => $administrator->id,
                'created_at' => now(),
            ],
        ]));

        $activityLogger->record('user.programs_assigned', $user, [
            'assigned_program_ids' => $programIds->values()->all(),
        ]);

        $freshUser = $user->fresh(['roles:id,name', 'assignedPrograms:id,code,name']);

        return response()->json([
            'data' => $this->formatUserPayload($freshUser),
            'message' => 'Assigned academic programs updated.',
        ]);
    }

    /**
     * Update permissions granted to a non-admin role.
     */
    public function updateRolePermissions(Role $role, Request $request, ActivityLogger $activityLogger): JsonResponse
    {
        $this->authorizeSystemAdministrator();

        abort_if(
            $role->name === 'system-administrator',
            403,
            'System administrator role permissions cannot be modified.',
        );

        $validated = $request->validate([
            'permissions' => ['present', 'array'],
            'permissions.*' => ['string', 'exists:permissions,name'],
        ]);

        $permissionIds = Permission::query()
            ->whereIn('name', $validated['permissions'])
            ->pluck('id')
            ->all();

        $role->permissions()->sync($permissionIds);

        $activityLogger->record('role.permissions_updated', $role, [
            'permissions' => $validated['permissions'],
        ]);

        return response()->json([
            'data' => [
                'id' => $role->id,
                'name' => $role->name,
                'label' => $role->label,
                'permissions' => $role->fresh()->permissions()->pluck('name')->values()->all(),
            ],
            'message' => 'Role permissions updated.',
        ]);
    }

    public function updateSuspension(User $user, Request $request, ActivityLogger $activityLogger): JsonResponse
    {
        $administrator = $this->authorizeSystemAdministrator();
        $this->ensureUserCanBeManaged($user, $administrator);

        $validated = $request->validate([
            'suspended' => ['required', 'boolean'],
        ]);

        $user->forceFill([
            'suspended_at' => $validated['suspended'] ? ($user->suspended_at ?? now()) : null,
        ])->save();

        if ($validated['suspended']) {
            $user->tokens()->delete();
        }

        $activityLogger->record(
            $user->isSuspended() ? 'user.suspended' : 'user.reactivated',
            $user,
            ['status' => $user->isSuspended() ? 'suspended' : 'active'],
        );

        return response()->json([
            'data' => [
                'id' => $user->id,
                'is_suspended' => $user->isSuspended(),
            ],
            'message' => $user->isSuspended() ? 'User suspended.' : 'User reactivated.',
        ]);
    }

    public function destroy(User $user, ActivityLogger $activityLogger): JsonResponse
    {
        $administrator = $this->authorizeSystemAdministrator();
        $this->ensureUserCanBeManaged($user, $administrator);

        $user->tokens()->delete();
        $user->delete();

        $activityLogger->record('user.deleted', $user, [
            'status' => 'deleted',
        ]);

        return response()->json(['message' => 'User deleted.']);
    }

    /**
     * @return array<string, mixed>
     */
    private function formatUserPayload(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'roles' => $user->roles->pluck('name')->values()->all(),
            'assigned_program_ids' => $user->assignedPrograms->pluck('id')->map(fn ($id) => (int) $id)->values()->all(),
            'assigned_programs' => $user->assignedPrograms->map(fn (AcademicProgram $program): array => [
                'id' => $program->id,
                'code' => $program->code,
                'name' => $program->name,
            ])->values()->all(),
            'alumni_profile_id' => $user->alumni_profile_id,
            'is_verified' => $user->email_verified_at !== null,
            'is_suspended' => $user->isSuspended(),
            'created_at' => $user->created_at?->toISOString(),
        ];
    }

    private function authorizeSystemAdministrator(): User
    {
        $administrator = request()->user();
        abort_unless($administrator?->hasRole('system-administrator'), 403);

        return $administrator;
    }

    private function ensureUserCanBeManaged(User $user, User $administrator): void
    {
        abort_if(
            $user->is($administrator) || $user->hasRole('system-administrator'),
            403,
            'System administrator accounts are protected.',
        );
    }
}
