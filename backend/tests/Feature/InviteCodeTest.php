<?php

use App\Domain\Auth\Enums\UserRole;
use App\Domain\Platform\Models\InviteCode;
use App\Domain\Tenancy\Enums\TenantPlan;
use App\Domain\Tenancy\Models\Country;
use App\Domain\Tenancy\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Illuminate\Testing\TestResponse;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    // Production default; phpunit.xml opens registration for the other suites.
    Config::set('auth.registration_mode', 'invite');
});

function signUp(array $overrides = [], string $path = '/api/v1/auth/register'): TestResponse
{
    app('auth')->forgetGuards();
    app('auth')->shouldUse('web');
    $country = Country::query()->firstOrCreate(['code' => 'BD'], ['name' => 'Bangladesh', 'active' => true]);

    $response = test()->withHeader('Origin', config('app.url'))->postJson($path, array_merge([
        'name' => 'Nusrat Jahan',
        'email' => 'nusrat'.uniqid().'@example.test',
        'password' => 'Invite#2026pass',
        'password_confirmation' => 'Invite#2026pass',
        'country_id' => $country->id,
    ], $overrides));

    // Don't let the new account's browser session leak into the next request.
    test()->flushHeaders();
    test()->flushSession();
    app('auth')->forgetGuards();

    return $response;
}

function invite(array $attributes = []): InviteCode
{
    return InviteCode::query()->create(array_merge(['code' => 'BETA2345', 'max_uses' => 1], $attributes));
}

function platformAdmin(UserRole $role = UserRole::PlatformAdmin): User
{
    return User::factory()->create(['tenant_id' => null, 'role' => $role]);
}

describe('signing up during the private beta', function (): void {
    it('tells the sign-up form an invite is needed', function (): void {
        $this->getJson('/api/v1/auth/registration')->assertOk()->assertJsonPath('data.mode', 'invite');
    });

    it('requires an invite code', function (): void {
        signUp()->assertUnprocessable()->assertJsonValidationErrors('invite_code');
        expect(User::query()->count())->toBe(0);
    });

    it('rejects an unknown code without creating the account', function (): void {
        signUp(['invite_code' => 'NOPE9999'])->assertUnprocessable()->assertJsonValidationErrors('invite_code');
        expect(User::query()->count())->toBe(0);
    });

    it('signs up with a valid code and records which invite was used', function (): void {
        $code = invite();

        signUp(['invite_code' => 'beta-2345 ', 'email' => 'nusrat@example.test'])->assertSuccessful();

        $user = User::query()->where('email', 'nusrat@example.test')->sole();
        expect($user->invite_code_id)->toBe($code->id);
        expect($code->fresh()->uses_count)->toBe(1);
        expect($code->fresh()->status())->toBe('used_up');
    });

    it('stops a single-use code from being used twice', function (): void {
        invite();
        signUp(['invite_code' => 'BETA2345'])->assertSuccessful();

        signUp(['invite_code' => 'BETA2345'])->assertUnprocessable()->assertJsonValidationErrors('invite_code');
        expect(User::query()->count())->toBe(1);
    });

    it('rejects expired and revoked codes', function (): void {
        invite(['code' => 'EXPIRED2', 'expires_at' => now()->subDay()]);
        invite(['code' => 'REVOKED2', 'revoked_at' => now()]);

        signUp(['invite_code' => 'EXPIRED2'])->assertUnprocessable();
        signUp(['invite_code' => 'REVOKED2'])->assertUnprocessable();
    });

    it('applies to sign-up from the mobile app too', function (): void {
        signUp(['device_name' => 'Pixel', 'platform' => 'android'], '/api/v1/mobile/register')
            ->assertUnprocessable()->assertJsonValidationErrors('invite_code');

        invite(['code' => 'MOBILE23']);
        signUp(['device_name' => 'Pixel', 'platform' => 'android', 'invite_code' => 'MOBILE23'], '/api/v1/mobile/register')
            ->assertCreated();
    });

    it('needs no code once an admin opens registration', function (): void {
        $this->actingAs(platformAdmin())->putJson('/api/v1/admin/registration-mode', ['mode' => 'open'])->assertOk();

        $this->getJson('/api/v1/auth/registration')->assertJsonPath('data.mode', 'open');
        signUp()->assertSuccessful();
    });

    it('still lets workspace admins add team members without codes', function (): void {
        $tenant = Tenant::factory()->create(['plan' => TenantPlan::Professional, 'trial_ends_at' => now()->addDays(30)]);
        $admin = User::factory()->create(['tenant_id' => $tenant->id, 'role' => UserRole::Admin]);
        $country = Country::query()->firstOrCreate(['code' => 'BD'], ['name' => 'Bangladesh', 'active' => true]);

        $this->actingAs($admin)->postJson('/api/v1/users', [
            'name' => 'Junior Associate', 'email' => 'junior@example.test', 'password' => 'Invite#2026pass',
            'role' => 'associate', 'country_id' => $country->id,
        ])->assertSuccessful();
    });
});

describe('Admin → Invites', function (): void {
    it('creates readable codes with a ready-made sign-up link', function (): void {
        $this->actingAs(platformAdmin());

        $created = $this->postJson('/api/v1/admin/invite-codes', ['label' => 'Rahman & Associates', 'max_uses' => 3, 'expires_in_days' => 14])
            ->assertCreated()->json('data');

        expect($created['code'])->toMatch('/^[A-HJ-NP-Z2-9]{8}$/');
        expect($created)->toMatchArray(['label' => 'Rahman & Associates', 'max_uses' => 3, 'uses_count' => 0, 'status' => 'active']);
        expect($created['signup_url'])->toEndWith('/register?invite='.$created['code']);
    });

    it('shows who signed up with each code, and can revoke one', function (): void {
        $this->actingAs(platformAdmin());
        $code = $this->postJson('/api/v1/admin/invite-codes', ['max_uses' => 5])->json('data');
        signUp(['invite_code' => $code['code'], 'name' => 'Nusrat Jahan'])->assertSuccessful();

        app('auth')->forgetGuards();
        $this->actingAs(platformAdmin());
        $listed = collect($this->getJson('/api/v1/admin/invite-codes')->json('data'))->firstWhere('code', $code['code']);
        expect($listed['uses_count'])->toBe(1);
        expect($listed['redeemed_by'][0]['name'])->toBe('Nusrat Jahan');

        $this->postJson("/api/v1/admin/invite-codes/{$code['public_id']}/revoke")->assertOk()->assertJsonPath('data.status', 'revoked');
        signUp(['invite_code' => $code['code']])->assertUnprocessable();
    });

    it('lets platform editors look but not create codes or open registration', function (): void {
        $this->actingAs(platformAdmin(UserRole::PlatformEditor));

        $this->getJson('/api/v1/admin/invite-codes')->assertOk()->assertJsonPath('meta.can_edit', false);
        $this->postJson('/api/v1/admin/invite-codes', ['max_uses' => 1])->assertForbidden();
        $this->putJson('/api/v1/admin/registration-mode', ['mode' => 'open'])->assertForbidden();
    });

    it('keeps workspace users out', function (): void {
        $tenant = Tenant::factory()->create(['plan' => TenantPlan::Professional, 'trial_ends_at' => now()->addDays(30)]);
        $this->actingAs(User::factory()->create(['tenant_id' => $tenant->id, 'role' => UserRole::Admin]));

        $this->getJson('/api/v1/admin/invite-codes')->assertForbidden();
        $this->postJson('/api/v1/admin/invite-codes', ['max_uses' => 1])->assertForbidden();
    });
});
