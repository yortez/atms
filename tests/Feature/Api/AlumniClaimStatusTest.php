<?php

use App\Models\AlumniProfile;
use App\Models\Role;
use App\Models\User;
use Laravel\Sanctum\Sanctum;

test('alumni listing reports claim status and can filter by it', function () {
    $claimed = AlumniProfile::create([
        'name' => 'Claimed Person', 'first_name' => 'Claimed', 'last_name' => 'Person',
        'email' => 'claimed@example.com', 'date_of_birth' => '1995-01-01',
    ]);
    $unclaimed = AlumniProfile::create([
        'name' => 'Unclaimed Person', 'first_name' => 'Unclaimed', 'last_name' => 'Zed',
        'email' => 'unclaimed@example.com', 'date_of_birth' => '1996-01-01',
    ]);
    User::factory()->create(['alumni_profile_id' => $claimed->id]);

    $coordinator = User::factory()->create();
    $role = Role::firstOrCreate(['name' => 'alumni-coordinator'], ['label' => 'Alumni Coordinator']);
    $coordinator->roles()->syncWithoutDetaching([$role->id => ['created_at' => now()]]);
    Sanctum::actingAs($coordinator, ['api']);

    $rows = collect($this->getJson('/api/alumni')->assertOk()->json('data'))->keyBy('id');
    expect($rows[$claimed->id]['is_claimed'])->toBeTrue();
    expect($rows[$claimed->id]['claimed_at'])->not->toBeNull();
    expect($rows[$unclaimed->id]['is_claimed'])->toBeFalse();
    expect($rows[$unclaimed->id]['claimed_at'])->toBeNull();

    $claimedOnly = $this->getJson('/api/alumni?claim_status=claimed')->assertOk()->json('data');
    expect(collect($claimedOnly)->pluck('id')->all())->toBe([$claimed->id]);

    $unclaimedOnly = $this->getJson('/api/alumni?claim_status=unclaimed')->assertOk()->json('data');
    expect(collect($unclaimedOnly)->pluck('id')->all())->toBe([$unclaimed->id]);
});


test('profile detail endpoint includes claim status and is restricted to authorized viewers', function () {
    $profile = AlumniProfile::create([
        'name' => 'Detail Person', 'first_name' => 'Detail', 'last_name' => 'Person',
        'email' => 'detail@example.com', 'date_of_birth' => '1994-02-02',
    ]);
    User::factory()->create(['alumni_profile_id' => $profile->id]);

    $coordinator = User::factory()->create();
    $role = Role::firstOrCreate(['name' => 'alumni-coordinator'], ['label' => 'Alumni Coordinator']);
    $coordinator->roles()->syncWithoutDetaching([$role->id => ['created_at' => now()]]);
    Sanctum::actingAs($coordinator, ['api']);

    $this->getJson("/api/alumni/{$profile->id}")
        ->assertOk()
        ->assertJsonPath('data.name', 'Detail Person')
        ->assertJsonPath('data.is_claimed', true);

    $stranger = User::factory()->create();
    Sanctum::actingAs($stranger, ['api']);
    $this->getJson("/api/alumni/{$profile->id}")->assertForbidden();
});
