<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

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
