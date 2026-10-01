<?php

use App\Domain\Auth\Enums\UserRole;
use App\Domain\Cases\Models\CaseFile;
use App\Domain\Hearings\Enums\HearingType;
use App\Domain\Hearings\Models\Hearing;
use App\Domain\Notifications\Models\CaseNotification;
use App\Domain\Notifications\Models\PushSubscription;
use App\Domain\Notifications\Push\PushSender;
use App\Domain\Tenancy\Enums\TenantPlan;
use App\Domain\Tenancy\Models\Tenant;
use App\Models\User;
use App\Support\TenantContext;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

class FakePushSender implements PushSender
{
    /** @var array<int, array{endpoint: string, payload: array}> */
    public array $sent = [];

    /** @var array<string, string> endpoint => result */
    public array $results = [];

    public function __construct(public bool $configured = true)
    {
    }

    public function isConfigured(): bool
    {
        return $this->configured;
    }

    public function send(PushSubscription $subscription, array $payload): string
    {
        $this->sent[] = ['endpoint' => $subscription->endpoint, 'payload' => $payload];

        return $this->results[$subscription->endpoint] ?? self::SENT;
    }
}

/**
 * @return array{tenant: Tenant, user: User, case: CaseFile, sender: FakePushSender}
 */
function pushFixture(bool $configured = true, int $subscriptions = 2): array
{
    $sender = new FakePushSender($configured);
    app()->instance(PushSender::class, $sender);

    $tenant = Tenant::factory()->create(['plan' => TenantPlan::Professional, 'trial_ends_at' => now()->addDays(30)]);
    $user = User::factory()->create(['tenant_id' => $tenant->id, 'role' => UserRole::Admin, 'locale' => 'bn']);

    TenantContext::set($tenant->id);
    try {
        $case = CaseFile::create([
            'tenant_id' => $tenant->id,
            'title' => 'State v. Push',
            'court' => 'District Court',
            'created_by' => $user->id,
        ]);
        Hearing::create([
            'tenant_id' => $tenant->id,
            'case_id' => $case->id,
            'hearing_at' => now()->addDay()->setTime(10, 0),
            'type' => HearingType::Mention,
            'created_by' => $user->id,
        ]);
        for ($i = 1; $i <= $subscriptions; $i++) {
            PushSubscription::create([
                'tenant_id' => $tenant->id,
                'user_id' => $user->id,
                'endpoint' => "https://push.example.test/device-{$i}",
                'endpoint_hash' => hash('sha256', "https://push.example.test/device-{$i}"),
                'p256dh_key' => 'p256dh-'.$i,
                'auth_key' => 'auth-'.$i,
                'content_encoding' => 'aes128gcm',
            ]);
        }
    } finally {
        TenantContext::clear();
    }

    return compact('tenant', 'user', 'case', 'sender');
}

it('pushes the hearing reminder to every subscribed browser, linked to the case', function (): void {
    $ctx = pushFixture();

    $this->artisan('hearings:send-reminders')->assertSuccessful();

    expect($ctx['sender']->sent)->toHaveCount(2);
    expect(collect($ctx['sender']->sent)->pluck('endpoint')->sort()->values()->all())
        ->toBe(['https://push.example.test/device-1', 'https://push.example.test/device-2']);
    expect($ctx['sender']->sent[0]['payload'])->toBe([
        'title' => 'শুনানির রিমাইন্ডার',
        'body' => 'রিমাইন্ডার: আগামীকাল শুনানি আছে।',
        'url' => '/cases/'.$ctx['case']->public_id,
    ]);
});

it('only pushes in-app notifications, not their email copies', function (): void {
    $ctx = pushFixture(subscriptions: 1);
    $ctx['tenant']->update(['trial_ends_at' => now()->addDays(3)->setTime(12, 0)]);

    // Creates an in_app and an email notification for the admin.
    $this->artisan('billing:send-trial-ending-reminders')->assertSuccessful();

    expect($ctx['sender']->sent)->toHaveCount(1);
    expect($ctx['sender']->sent[0]['payload']['url'])->toBe('/settings/billing');
});

it('removes subscriptions the push service reports as expired', function (): void {
    $ctx = pushFixture();
    $ctx['sender']->results['https://push.example.test/device-1'] = PushSender::EXPIRED;

    $this->artisan('hearings:send-reminders')->assertSuccessful();

    $remaining = PushSubscription::query()->withoutGlobalScopes()->pluck('endpoint')->all();
    expect($remaining)->toBe(['https://push.example.test/device-2']);
    expect(PushSubscription::query()->withoutGlobalScopes()->value('last_used_at'))->not->toBeNull();
});

it('sends nothing when VAPID keys are not configured', function (): void {
    $ctx = pushFixture(configured: false);

    $this->artisan('hearings:send-reminders')->assertSuccessful();

    expect($ctx['sender']->sent)->toBe([]);
    expect(CaseNotification::query()->withoutGlobalScopes()->where('channel', 'in_app')->count())->toBe(1);
});

it('sends nothing to users who never opted in', function (): void {
    $ctx = pushFixture(subscriptions: 0);

    $this->artisan('hearings:send-reminders')->assertSuccessful();

    expect($ctx['sender']->sent)->toBe([]);
});
