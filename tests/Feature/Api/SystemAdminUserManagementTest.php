<?php

use App\Models\Role;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Support\Facades\Notification;

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
    $this->actingAs($user)->postJson('/api/admin/users', [
        'name' => 'Invited User',
        'email' => 'invited@example.com',
        'roles' => ['alumni'],
    ])->assertForbidden();
});

test('system administrators can invite users with roles and send a password setup link', function () {
    Notification::fake();

    $admin = User::factory()->create();
    assignSystemRole($admin, 'system-administrator');

    $this->actingAs($admin)->postJson('/api/admin/users', [
        'name' => 'Invited User',
        'email' => 'INVITED@example.com',
        'roles' => ['alumni-coordinator', 'alumni'],
    ])->assertCreated()
        ->assertJsonPath('data.email', 'invited@example.com')
        ->assertJsonPath('data.roles', ['alumni-coordinator', 'alumni'])
        ->assertJsonPath('message', 'Invitation sent.');

    $invited = User::query()->where('email', 'invited@example.com')->firstOrFail();

    expect($invited->roles()->pluck('name')->all())
        ->toContain('alumni-coordinator', 'alumni');
    expect($invited->roles()->where('name', 'alumni-coordinator')->first()->pivot->assigned_by_user_id)
        ->toBe($admin->id);
    Notification::assertSentTo($invited, ResetPassword::class);
});

test('inviting a user requires a unique email and at least one valid role', function () {
    $admin = User::factory()->create();
    assignSystemRole($admin, 'system-administrator');
    User::factory()->create(['email' => 'existing@example.com']);

    $this->actingAs($admin)->postJson('/api/admin/users', [
        'name' => 'Invited User',
        'email' => 'existing@example.com',
        'roles' => ['alumni'],
    ])->assertUnprocessable()
        ->assertJsonValidationErrors('email');

    $this->actingAs($admin)->postJson('/api/admin/users', [
        'name' => 'Invited User',
        'email' => 'new@example.com',
        'roles' => [],
    ])->assertUnprocessable()
        ->assertJsonValidationErrors('roles');

    $this->actingAs($admin)->postJson('/api/admin/users', [
        'name' => 'Invited User',
        'email' => 'new@example.com',
        'roles' => ['unknown-role'],
    ])->assertUnprocessable()
        ->assertJsonValidationErrors('roles.0');
});

test('authorization seeding grants the expected role permissions and is repeatable', function () {
    $seeder = new RoleSeeder;
    $seeder->run();
    $seeder->run();

    $allPermissions = [
        'alumni.create',
        'alumni.update',
        'alumni.view',
        'announcements.manage',
        'jobs.manage',
        'reports.view',
        'surveys.manage',
    ];

    expect(Role::query()->count())->toBe(5)
        ->and(Role::query()->where('name', 'system-administrator')->firstOrFail()
            ->permissions()->pluck('name')->sort()->values()->all())->toBe($allPermissions)
        ->and(Role::query()->where('name', 'alumni-coordinator')->firstOrFail()
            ->permissions()->pluck('name')->sort()->values()->all())->toBe($allPermissions)
        ->and(Role::query()->where('name', 'department-coordinator')->firstOrFail()
            ->permissions()->pluck('name')->sort()->values()->all())->toBe(['alumni.view', 'reports.view'])
        ->and(Role::query()->whereIn('name', ['alumni', 'employer'])
            ->whereHas('permissions')->exists())->toBeFalse();
});
