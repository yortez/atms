<?php

use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Laravel\Sanctum\Sanctum;

test('verified users can issue and revoke Sanctum API tokens', function () {
    $user = User::factory()->create();

    $token = $this->postJson('/api/auth/token', [
        'email' => $user->email,
        'password' => 'password',
        'device_name' => 'test-device',
    ])->assertCreated()
        ->json('data.token');

    expect($token)->toBeString()
        ->and($user->tokens()->count())->toBe(1);

    $this->withToken($token)->getJson('/api/employment-statuses')->assertOk();
    $this->withToken($token)->deleteJson('/api/auth/token')->assertNoContent();
    Auth::forgetGuards();
    $this->withToken($token)->getJson('/api/employment-statuses')->assertUnauthorized();

    expect($user->tokens()->count())->toBe(0);
});

test('API token issuance rejects invalid credentials and unverified accounts', function () {
    $user = User::factory()->create();

    $this->postJson('/api/auth/token', [
        'email' => $user->email,
        'password' => 'incorrect',
        'device_name' => 'test-device',
    ])->assertUnauthorized();

    $unverified = User::factory()->unverified()->create();
    $this->postJson('/api/auth/token', [
        'email' => $unverified->email,
        'password' => 'password',
        'device_name' => 'test-device',
    ])->assertForbidden();

    expect($user->tokens()->count())->toBe(0)
        ->and($unverified->tokens()->count())->toBe(0);
});

test('users cannot revoke another users API token', function () {
    $owner = User::factory()->create();
    $token = $owner->createToken('test-device', ['api'])->plainTextToken;
    $otherUser = User::factory()->create();

    Sanctum::actingAs($otherUser, ['api']);
    $this->withToken($token)->deleteJson('/api/auth/token')->assertForbidden();

    expect($owner->tokens()->count())->toBe(1);
});

test('changing a password revokes the user personal access tokens', function () {
    $user = User::factory()->create();
    $user->createToken('test-device', ['api']);

    $this->actingAs($user)->put('/settings/password', [
        'current_password' => 'password',
        'password' => 'NewPassword123!',
        'password_confirmation' => 'NewPassword123!',
    ])->assertRedirect();

    expect($user->tokens()->count())->toBe(0);
});
