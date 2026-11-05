<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\User;
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
     * List all users and their assigned roles for system administrators.
     */
    public function index(): JsonResponse
    {
        $this->authorizeSystemAdministrator();

        $users = User::query()->with('roles:id,name')->orderBy('name')->get()->map(function (User $user): array {
            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'roles' => $user->roles->pluck('name')->all(),
                'is_suspended' => $user->isSuspended(),
            ];
        });

        return response()->json([
            'data' => $users,
        ]);
    }

    /**
     * Create an account and send its user a password setup link.
     */
    public function invite(Request $request): JsonResponse
    {
        $this->authorizeSystemAdministrator();

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
        ]);

        $user = DB::transaction(function () use ($validated, $request): User {
            $user = new User([
                'name' => trim($validated['name']),
                'email' => $validated['email'],
                'password' => Str::random(48),
            ]);
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
                    'assigned_by_user_id' => $request->user()->id,
                    'created_at' => now(),
                ],
            ]));

            $status = Password::sendResetLink(['email' => $user->email]);
            if ($status !== Password::RESET_LINK_SENT) {
                throw ValidationException::withMessages([
                    'email' => [trans($status)],
                ]);
            }

            return $user;
        });

        return response()->json([
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'roles' => $user->roles()->pluck('name')->all(),
                'is_suspended' => false,
            ],
            'message' => 'Invitation sent.',
        ], 201);
    }

    /**
     * Update the roles assigned to a user.
     */
    public function updateRoles(User $user, Request $request): JsonResponse
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
        ]);

        foreach ($availableRoles as $roleName) {
            Role::query()->firstOrCreate(
                ['name' => $roleName],
                ['label' => Str::headline($roleName)],
            );
        }

        $roleIds = Role::query()->whereIn('name', $validated['roles'] ?? [])->pluck('id')->all();
        $user->roles()->sync($roleIds);

        return response()->json([
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'roles' => $user->fresh()->roles()->pluck('name')->all(),
                'is_suspended' => $user->isSuspended(),
            ],
        ]);
    }

    public function updateSuspension(User $user, Request $request): JsonResponse
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

        return response()->json([
            'data' => [
                'id' => $user->id,
                'is_suspended' => $user->isSuspended(),
            ],
            'message' => $user->isSuspended() ? 'User suspended.' : 'User reactivated.',
        ]);
    }

    public function destroy(User $user): JsonResponse
    {
        $administrator = $this->authorizeSystemAdministrator();
        $this->ensureUserCanBeManaged($user, $administrator);

        $user->tokens()->delete();
        $user->delete();

        return response()->json(['message' => 'User deleted.']);
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
