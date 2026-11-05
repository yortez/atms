<?php

use App\Models\Role;
use App\Models\User;

function assignSystemRole(User $user, string $name): void
{
    $role = Role::query()->firstOrCreate(['name' => $name], ['label' => str($name)->headline()]);
    $user->roles()->syncWithoutDetaching([$role->id => ['created_at' => now()]]);
}

test('system administrators can list and update user roles', function () {
    $admin = User::factory()->create();
    assignSystemRole($admin, 'system-administrator');

    $member = User::factory()->create();

    $this->actingAs($admin)->getJson('/api/admin/users')
        ->assertOk()
        ->assertJsonFragment(['email' => $member->email]);

    $this->actingAs($admin)->patchJson("/api/admin/users/{$member->id}/roles", [
        'roles' => ['alumni-coordinator', 'alumni'],
    ])->assertOk()
        ->assertJsonFragment(['alumni-coordinator'])
        ->assertJsonFragment(['alumni']);

    expect($member->fresh()->roles()->pluck('name')->all())
        ->toContain('alumni-coordinator', 'alumni');
});

test('non-administrators cannot manage user roles', function () {
    $user = User::factory()->create();
    $target = User::factory()->create();

    $this->actingAs($user)->getJson('/api/admin/users')->assertForbidden();
    $this->actingAs($user)->patchJson("/api/admin/users/{$target->id}/roles", ['roles' => ['alumni']])->assertForbidden();
});
