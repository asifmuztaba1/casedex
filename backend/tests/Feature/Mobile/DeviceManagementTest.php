<?php

use App\Domain\Auth\Enums\UserRole;
use App\Domain\Auth\Models\AuditLog;
use App\Domain\Auth\Models\DeviceToken;
use App\Domain\Tenancy\Enums\TenantPlan;
use App\Domain\Tenancy\Models\Country;
use App\Domain\Tenancy\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Password;

uses(RefreshDatabase::class);

function deviceOwner(UserRole $role = UserRole::Lawyer, ?Tenant $tenant = null): User
{
    $tenant ??= Tenant::factory()->create(['plan' => TenantPlan::Professional, 'trial_ends_at' => now()->addDays(30)]);
    $country = Country::query()->firstOrCreate(['code' => 'BD'], ['name' => 'Bangladesh', 'active' => true]);

    return User::factory()->create([
        'tenant_id' => $tenant->id,
        'country_id' => $country->id,
        'role' => $role,
        'password' => 'Mobile#2026pass',
    ]);
}

/** Signs a phone in and returns its token. */
function signInPhone(User $user, string $name): string
{
    app('auth')->forgetGuards();

    return test()->postJson('/api/v1/mobile/login', [
        'email' => $user->email,
        'password' => 'Mobile#2026pass',
        'device_name' => $name,
        'platform' => 'android',
    ])->assertOk()->json('data.token');
}

function tokenWorks(string $token): bool
{
    app('auth')->forgetGuards();

    return test()->withToken($token)->getJson('/api/v1/auth/me')->status() === 200;
}

it('lets the web settings page list and sign out a lost phone', function (): void {
    $user = deviceOwner();
    $lost = signInPhone($user, 'Lost Pixel');
    $kept = signInPhone($user, 'iPad');

    app('auth')->forgetGuards();
    $this->actingAs($user); // browser session
    $devices = $this->getJson('/api/v1/devices')->assertOk()->json('data');

    expect(collect($devices)->pluck('name')->sort()->values()->all())->toBe(['Lost Pixel', 'iPad']);
    expect(collect($devices)->pluck('is_current')->unique()->all())->toBe([false]);

    $lostId = collect($devices)->firstWhere('name', 'Lost Pixel')['public_id'];
    $this->deleteJson("/api/v1/devices/{$lostId}")->assertNoContent();

    expect(tokenWorks($lost))->toBeFalse();
    expect(tokenWorks($kept))->toBeTrue();
});

it('signs out every phone from the web', function (): void {
    $user = deviceOwner();
    $phones = [signInPhone($user, 'Phone A'), signInPhone($user, 'Phone B')];

    app('auth')->forgetGuards();
    $this->actingAs($user);
    $this->deleteJson('/api/v1/devices')->assertOk()->assertJsonPath('data.revoked', 2);

    expect(collect($phones)->map(fn (string $t): bool => tokenWorks($t))->all())->toBe([false, false]);
    expect(AuditLog::query()->withoutGlobalScopes()->where('action', 'auth.devices_revoked')->value('metadata'))
        ->toMatchArray(['reason' => 'signed_out_everywhere', 'count' => 2]);
});

it('keeps the asking phone when signing out everywhere from a phone', function (): void {
    $user = deviceOwner();
    $self = signInPhone($user, 'This phone');
    $other = signInPhone($user, 'Other phone');

    app('auth')->forgetGuards();
    $this->withToken($self)->deleteJson('/api/v1/devices')->assertOk()->assertJsonPath('data.revoked', 1);

    expect(tokenWorks($self))->toBeTrue();
    expect(tokenWorks($other))->toBeFalse();
});

it('cannot list or revoke another user devices from the web', function (): void {
    $owner = deviceOwner();
    $phone = signInPhone($owner, 'Owner phone');
    $deviceId = DeviceToken::query()->value('public_id');

    app('auth')->forgetGuards();
    $this->actingAs(deviceOwner());
    expect($this->getJson('/api/v1/devices')->json('data'))->toBe([]);
    $this->deleteJson("/api/v1/devices/{$deviceId}")->assertNotFound();
    $this->deleteJson('/api/v1/devices')->assertJsonPath('data.revoked', 0);

    expect(tokenWorks($phone))->toBeTrue();
});

it('signs every phone out after a password reset', function (): void {
    $user = deviceOwner();
    $phone = signInPhone($user, 'Phone');

    app('auth')->forgetGuards();
    $this->postJson('/api/v1/auth/reset-password', [
        'token' => Password::createToken($user),
        'email' => $user->email,
        'password' => 'Brand#New2026pass',
        'password_confirmation' => 'Brand#New2026pass',
    ])->assertNoContent();

    expect(tokenWorks($phone))->toBeFalse();
    expect(AuditLog::query()->withoutGlobalScopes()->where('action', 'auth.devices_revoked')->value('metadata'))
        ->toMatchArray(['reason' => 'password_changed', 'count' => 1]);
});

it('signs other phones out when the password is changed in the profile, keeping the phone that changed it', function (): void {
    $user = deviceOwner();
    $self = signInPhone($user, 'This phone');
    $other = signInPhone($user, 'Other phone');

    app('auth')->forgetGuards();
    $this->withToken($self)->putJson('/api/v1/profile', [
        'name' => $user->name,
        'email' => $user->email,
        'country_id' => $user->country_id,
        'password' => 'Brand#New2026pass',
    ])->assertOk();

    expect(tokenWorks($self))->toBeTrue();
    expect(tokenWorks($other))->toBeFalse();
});

it('signs a member out of their phones when an admin resets their password', function (): void {
    $admin = deviceOwner(UserRole::Admin);
    $member = deviceOwner(UserRole::Lawyer, $admin->tenant);
    $phone = signInPhone($member, 'Member phone');

    app('auth')->forgetGuards();
    $this->actingAs($admin)->putJson("/api/v1/users/{$member->public_id}", [
        'name' => $member->name,
        'email' => $member->email,
        'role' => 'lawyer',
        'country_id' => $member->country_id,
        'password' => 'Reset#ByAdmin2026',
    ])->assertOk();

    expect(tokenWorks($phone))->toBeFalse();
});

it('keeps phones signed in when the profile changes without a new password', function (): void {
    $user = deviceOwner();
    $phone = signInPhone($user, 'Phone');

    app('auth')->forgetGuards();
    $this->actingAs($user)->putJson('/api/v1/profile', [
        'name' => 'Renamed User',
        'email' => $user->email,
        'country_id' => $user->country_id,
    ])->assertOk();

    expect(tokenWorks($phone))->toBeTrue();
});
