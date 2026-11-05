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
        abort_unless(auth()->user()->hasRole('system-administrator'), 403);

        $users = User::query()->with('roles:id,name')->orderBy('name')->get()->map(function (User $user): array {
            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'roles' => $user->roles->pluck('name')->all(),
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
        abort_unless($request->user()->hasRole('system-administrator'), 403);

        $availableRoles = [
            'system-administrator',
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
            ],
            'message' => 'Invitation sent.',
        ], 201);
    }

    /**
     * Update the roles assigned to a user.
     */
    public function updateRoles(User $user, Request $request): JsonResponse
    {
        abort_unless(auth()->user()->hasRole('system-administrator'), 403);

        $availableRoles = [
            'system-administrator',
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
            ],
        ]);
    }
}
