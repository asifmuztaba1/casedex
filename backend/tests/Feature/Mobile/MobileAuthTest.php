<?php

use App\Domain\Auth\Enums\UserRole;
use App\Domain\Auth\Models\AuditLog;
use App\Domain\Auth\Models\DeviceToken;
use App\Domain\Tenancy\Enums\TenantPlan;
use App\Domain\Tenancy\Models\Country;
use App\Domain\Tenancy\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Illuminate\Testing\TestResponse;

uses(RefreshDatabase::class);

function mobileUser(UserRole $role = UserRole::Admin): User
{
    $tenant = Tenant::factory()->create(['plan' => TenantPlan::Professional, 'trial_ends_at' => now()->addDays(30)]);

    return User::factory()->create([
        'tenant_id' => $role === UserRole::PlatformAdmin ? null : $tenant->id,
        'role' => $role,
        'password' => 'Mobile#2026pass',
    ]);
}

/**
 * @return array<string, mixed> the mobile session payload
 */
function mobileLogin(User $user, string $device = 'Pixel 8', string $platform = 'android'): array
{
    return test()->postJson('/api/v1/mobile/login', [
        'email' => $user->email,
        'password' => 'Mobile#2026pass',
        'device_name' => $device,
        'platform' => $platform,
    ])->assertOk()->json('data');
}

/** A request as a separate app call: Laravel's test client otherwise reuses the resolved user. */
function asDevice(string $token, string $method, string $uri, array $data = []): TestResponse
{
    app('auth')->forgetGuards();

    return test()->withToken($token)->json($method, $uri, $data);
}

it('signs a device in and returns a bearer token that works on the regular API', function (): void {
    $user = mobileUser();

    $session = mobileLogin($user);

    expect($session['token_type'])->toBe('Bearer');
    expect($session['token'])->toBeString()->not->toBeEmpty();
    expect(Str::isUlid($session['device']['public_id']))->toBeTrue();
    expect($session['device'])->toMatchArray(['name' => 'Pixel 8', 'platform' => 'android', 'push_enabled' => false]);
    expect($session['user']['public_id'])->toBe($user->public_id);
    expect(now()->diffInDays($session['expires_at']))->toBeGreaterThan(59);

    asDevice($session['token'], 'GET', '/api/v1/auth/me')->assertOk()->assertJsonPath('data.email', $user->email);
    asDevice($session['token'], 'POST', '/api/v1/cases', [
        'title' => 'State v. Rahman',
        'court' => 'District Court',
        'client' => ['name' => 'Karim Rahman'],
    ])->assertCreated();
    asDevice($session['token'], 'GET', '/api/v1/cases')->assertOk()->assertJsonCount(1, 'data');
});

it('stores only a hash of the token', function (): void {
    $session = mobileLogin(mobileUser());

    $stored = DeviceToken::query()->value('token');
    expect($stored)->not->toBe($session['token']);
    expect($stored)->toBe(hash('sha256', Str::after($session['token'], '|')));
});

it('rejects a wrong password without issuing a token', function (): void {
    $user = mobileUser();

    $this->postJson('/api/v1/mobile/login', [
        'email' => $user->email,
        'password' => 'wrong',
        'device_name' => 'Pixel 8',
        'platform' => 'android',
    ])->assertStatus(422);

    expect(DeviceToken::query()->count())->toBe(0);
});

it('requires a device name and a known platform', function (): void {
    $user = mobileUser();

    $this->postJson('/api/v1/mobile/login', ['email' => $user->email, 'password' => 'Mobile#2026pass', 'platform' => 'windows'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['device_name', 'platform']);
});

it('does not issue tokens to platform staff', function (): void {
    $admin = mobileUser(UserRole::PlatformAdmin);

    $this->postJson('/api/v1/mobile/login', [
        'email' => $admin->email,
        'password' => 'Mobile#2026pass',
        'device_name' => 'iPhone',
        'platform' => 'ios',
    ])->assertForbidden();

    expect(DeviceToken::query()->count())->toBe(0);
});

it('registers a new account with a device token', function (): void {
    $country = Country::query()->firstOrCreate(['code' => 'BD'], ['name' => 'Bangladesh', 'active' => true]);

    $session = $this->postJson('/api/v1/mobile/register', [
        'name' => 'Nusrat Jahan',
        'email' => 'nusrat@example.test',
        'password' => 'Mobile#2026pass',
        'password_confirmation' => 'Mobile#2026pass',
        'country_id' => $country->id,
        'locale' => 'bn',
        'device_name' => 'Galaxy A55',
        'platform' => 'android',
    ])->assertCreated()->json('data');

    expect($session['user']['email'])->toBe('nusrat@example.test');
    expect($session['user']['tenant_public_id'])->toBeNull();
    asDevice($session['token'], 'GET', '/api/v1/auth/me')->assertOk()->assertJsonPath('data.locale', 'bn');

    // No workspace yet: a clear 403 the app can route to onboarding, not a 401 that reads as "signed out".
    asDevice($session['token'], 'GET', '/api/v1/cases')
        ->assertForbidden()
        ->assertJsonPath('error', 'workspace_required');
    asDevice($session['token'], 'GET', '/api/v1/auth/me')->assertOk();
});

it('refreshes a token: the new one works, the old one stops, push stays registered', function (): void {
    $session = mobileLogin(mobileUser());
    asDevice($session['token'], 'PUT', '/api/v1/mobile/push-token', ['push_token' => 'fcm-device-1'])->assertOk();

    $refreshed = asDevice($session['token'], 'POST', '/api/v1/mobile/token/refresh')->assertOk()->json('data');

    expect($refreshed['token'])->not->toBe($session['token']);
    expect($refreshed['device']['push_enabled'])->toBeTrue();
    asDevice($session['token'], 'GET', '/api/v1/auth/me')->assertUnauthorized();
    asDevice($refreshed['token'], 'GET', '/api/v1/auth/me')->assertOk();
    expect(DeviceToken::query()->count())->toBe(1);
});

it('signs the device out', function (): void {
    $session = mobileLogin(mobileUser());

    asDevice($session['token'], 'POST', '/api/v1/mobile/logout')->assertNoContent();

    asDevice($session['token'], 'GET', '/api/v1/auth/me')->assertUnauthorized();
    expect(DeviceToken::query()->count())->toBe(0);
});

it('rejects an expired token', function (): void {
    $session = mobileLogin(mobileUser());
    DeviceToken::query()->update(['expires_at' => now()->subMinute()]);

    asDevice($session['token'], 'GET', '/api/v1/auth/me')->assertUnauthorized();
});

it('lists the user devices and revokes another one', function (): void {
    $user = mobileUser();
    $phone = mobileLogin($user, 'Pixel 8', 'android');
    $tablet = mobileLogin($user, 'iPad', 'ios');

    $devices = asDevice($phone['token'], 'GET', '/api/v1/mobile/devices')->assertOk()->json('data');

    expect(collect($devices)->pluck('name')->sort()->values()->all())->toBe(['Pixel 8', 'iPad']);
    expect(collect($devices)->firstWhere('name', 'Pixel 8')['is_current'])->toBeTrue();
    expect(collect($devices)->firstWhere('name', 'iPad')['is_current'])->toBeFalse();
    expect($devices[0])->toHaveKeys(['public_id', 'name', 'platform', 'push_enabled', 'is_current', 'last_used_at', 'expires_at', 'created_at']);
    expect($devices[0])->not->toHaveKeys(['id', 'token', 'tokenable_id', 'push_token']);

    asDevice($phone['token'], 'DELETE', "/api/v1/mobile/devices/{$tablet['device']['public_id']}")->assertNoContent();

    asDevice($tablet['token'], 'GET', '/api/v1/auth/me')->assertUnauthorized();
    asDevice($phone['token'], 'GET', '/api/v1/auth/me')->assertOk();
});

it('cannot see or revoke another user devices', function (): void {
    $mine = mobileLogin(mobileUser());
    $theirs = mobileLogin(mobileUser(), 'Other phone');

    $devices = asDevice($mine['token'], 'GET', '/api/v1/mobile/devices')->json('data');
    expect(collect($devices)->pluck('public_id')->all())->toBe([$mine['device']['public_id']]);

    asDevice($mine['token'], 'DELETE', "/api/v1/mobile/devices/{$theirs['device']['public_id']}")->assertNotFound();
    asDevice($theirs['token'], 'GET', '/api/v1/auth/me')->assertOk();
});

it('keeps tenants apart for token users', function (): void {
    $a = mobileLogin(mobileUser());
    $b = mobileLogin(mobileUser());
    $caseA = asDevice($a['token'], 'POST', '/api/v1/cases', [
        'title' => 'SECRET-A',
        'court' => 'District Court',
        'client' => ['name' => 'Client A'],
    ])->assertCreated()->json('data.public_id');

    asDevice($b['token'], 'GET', "/api/v1/cases/{$caseA}")->assertNotFound();
    expect(asDevice($b['token'], 'GET', '/api/v1/cases')->getContent())->not->toContain('SECRET-A');
});

it('requires a device token for device endpoints', function (): void {
    $user = mobileUser();
    $this->actingAs($user); // a browser session, no token

    $this->getJson('/api/v1/mobile/devices')->assertForbidden();
    $this->postJson('/api/v1/mobile/logout')->assertForbidden();
});

it('records mobile sign-in, sign-out and device revocation in the audit log', function (): void {
    $user = mobileUser();
    $phone = mobileLogin($user);
    $tablet = mobileLogin($user, 'iPad', 'ios');
    asDevice($phone['token'], 'DELETE', "/api/v1/mobile/devices/{$tablet['device']['public_id']}")->assertNoContent();
    asDevice($phone['token'], 'POST', '/api/v1/mobile/logout')->assertNoContent();

    $entries = AuditLog::query()->withoutGlobalScopes()
        ->where('user_id', $user->id)
        ->whereIn('action', ['auth.login', 'auth.logout', 'auth.device_revoked'])
        ->orderBy('id')
        ->get();

    expect($entries->pluck('action')->all())->toBe(['auth.login', 'auth.login', 'auth.device_revoked', 'auth.logout']);
    expect($entries->first()->metadata)->toMatchArray(['channel' => 'mobile', 'device' => 'Pixel 8', 'platform' => 'android']);
});
