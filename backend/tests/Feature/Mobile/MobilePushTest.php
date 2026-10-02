<?php

use App\Domain\Auth\Enums\UserRole;
use App\Domain\Auth\Models\DeviceToken;
use App\Domain\Cases\Models\CaseFile;
use App\Domain\Hearings\Enums\HearingType;
use App\Domain\Hearings\Models\Hearing;
use App\Domain\Notifications\Push\MobilePushSender;
use App\Domain\Tenancy\Enums\TenantPlan;
use App\Domain\Tenancy\Models\Tenant;
use App\Models\User;
use App\Support\TenantContext;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

class FakeMobilePushSender implements MobilePushSender
{
    /** @var array<int, array{token: string, payload: array}> */
    public array $sent = [];

    /** @var array<string, string> push token => result */
    public array $results = [];

    public function __construct(public bool $configured = true)
    {
    }

    public function isConfigured(): bool
    {
        return $this->configured;
    }

    public function send(string $pushToken, array $payload): string
    {
        $this->sent[] = ['token' => $pushToken, 'payload' => $payload];

        return $this->results[$pushToken] ?? self::SENT;
    }
}

/**
 * A Bangla-speaking admin with a hearing tomorrow, signed in on one phone.
 *
 * @return array{user: User, case: CaseFile, token: string, sender: FakeMobilePushSender}
 */
function mobilePushFixture(bool $configured = true): array
{
    $sender = new FakeMobilePushSender($configured);
    app()->instance(MobilePushSender::class, $sender);

    $tenant = Tenant::factory()->create(['plan' => TenantPlan::Professional, 'trial_ends_at' => now()->addDays(30)]);
    $user = User::factory()->create([
        'tenant_id' => $tenant->id,
        'role' => UserRole::Admin,
        'locale' => 'bn',
        'password' => 'Mobile#2026pass',
    ]);

    TenantContext::set($tenant->id);
    try {
        $case = CaseFile::create(['tenant_id' => $tenant->id, 'title' => 'State v. Push', 'court' => 'District Court', 'created_by' => $user->id]);
        Hearing::create([
            'tenant_id' => $tenant->id,
            'case_id' => $case->id,
            'hearing_at' => now()->addDay()->setTime(10, 0),
            'type' => HearingType::Mention,
            'created_by' => $user->id,
        ]);
    } finally {
        TenantContext::clear();
    }

    $token = test()->postJson('/api/v1/mobile/login', [
        'email' => $user->email,
        'password' => 'Mobile#2026pass',
        'device_name' => 'Pixel 8',
        'platform' => 'android',
    ])->assertOk()->json('data.token');

    return compact('user', 'case', 'token', 'sender');
}

function registerPushToken(string $token, string $pushToken): void
{
    app('auth')->forgetGuards();
    test()->withToken($token)->putJson('/api/v1/mobile/push-token', ['push_token' => $pushToken])
        ->assertOk()
        ->assertJsonPath('data.push_enabled', true);
}

it('sends the hearing reminder to the registered phone, in the user language, linked to the case', function (): void {
    $ctx = mobilePushFixture();
    registerPushToken($ctx['token'], 'fcm-pixel-8');

    $this->artisan('hearings:send-reminders')->assertSuccessful();

    expect($ctx['sender']->sent)->toHaveCount(1);
    expect($ctx['sender']->sent[0]['token'])->toBe('fcm-pixel-8');
    expect($ctx['sender']->sent[0]['payload'])->toMatchArray([
        'title' => 'শুনানির রিমাইন্ডার',
        'body' => 'রিমাইন্ডার: আগামীকাল শুনানি আছে।',
        'url' => '/cases/'.$ctx['case']->public_id,
    ]);
    expect($ctx['sender']->sent[0]['payload']['data'])->toMatchArray([
        'notification_type' => 'hearing_reminder',
        'case_public_id' => $ctx['case']->public_id,
    ]);
    expect($ctx['sender']->sent[0]['payload']['data'])->each->toBeString();
});

it('sends nothing to devices that never registered for push', function (): void {
    $ctx = mobilePushFixture();

    $this->artisan('hearings:send-reminders')->assertSuccessful();

    expect($ctx['sender']->sent)->toBe([]);
});

it('sends nothing when FCM is not configured', function (): void {
    $ctx = mobilePushFixture(configured: false);
    registerPushToken($ctx['token'], 'fcm-pixel-8');

    $this->artisan('hearings:send-reminders')->assertSuccessful();

    expect($ctx['sender']->sent)->toBe([]);
});

it('forgets a push token FCM reports as unregistered', function (): void {
    $ctx = mobilePushFixture();
    registerPushToken($ctx['token'], 'fcm-uninstalled');
    $ctx['sender']->results['fcm-uninstalled'] = MobilePushSender::EXPIRED;

    $this->artisan('hearings:send-reminders')->assertSuccessful();

    $device = DeviceToken::query()->sole();
    expect($device->push_token)->toBeNull();
    expect($device->push_token_hash)->toBeNull();
});

it('stops pushing to a device after it signs out', function (): void {
    $ctx = mobilePushFixture();
    registerPushToken($ctx['token'], 'fcm-pixel-8');
    app('auth')->forgetGuards();
    $this->withToken($ctx['token'])->postJson('/api/v1/mobile/logout')->assertNoContent();

    $this->artisan('hearings:send-reminders')->assertSuccessful();

    expect($ctx['sender']->sent)->toBe([]);
});

it('moves a shared phone push registration to whoever signed in last', function (): void {
    $first = mobilePushFixture();
    registerPushToken($first['token'], 'fcm-shared-phone');
    $second = mobilePushFixture();
    registerPushToken($second['token'], 'fcm-shared-phone');

    $this->artisan('hearings:send-reminders')->assertSuccessful();

    // Both users have a hearing tomorrow, but only the current user of the phone is pushed.
    expect($second['sender']->sent)->toHaveCount(1);
    expect(DeviceToken::query()->whereNotNull('push_token')->sole()->tokenable_id)->toBe($second['user']->id);
});

it('unregisters push for the current device', function (): void {
    $ctx = mobilePushFixture();
    registerPushToken($ctx['token'], 'fcm-pixel-8');

    app('auth')->forgetGuards();
    $this->withToken($ctx['token'])->deleteJson('/api/v1/mobile/push-token')->assertNoContent();

    expect(DeviceToken::query()->sole()->push_token)->toBeNull();
});
