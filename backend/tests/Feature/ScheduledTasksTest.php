<?php

use App\Domain\Auth\Enums\UserRole;
use App\Domain\Cases\Models\CaseFile;
use App\Domain\Hearings\Enums\HearingType;
use App\Domain\Hearings\Models\Hearing;
use App\Domain\Notifications\Models\CaseNotification;
use App\Domain\Tenancy\Enums\TenantPlan;
use App\Domain\Tenancy\Models\Tenant;
use App\Models\User;
use App\Support\TenantContext;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;

uses(RefreshDatabase::class);

/**
 * @return array{tenant: Tenant, admin: User, case: CaseFile}
 */
function scheduledTenant(string $label): array
{
    $tenant = Tenant::factory()->create([
        'name' => "Tenant {$label}",
        'plan' => TenantPlan::Professional,
        'trial_ends_at' => now()->addDays(30),
    ]);
    $admin = User::factory()->create([
        'tenant_id' => $tenant->id,
        'role' => UserRole::Admin,
    ]);

    TenantContext::set($tenant->id);
    try {
        $case = CaseFile::create([
            'tenant_id' => $tenant->id,
            'title' => "Case {$label}",
            'court' => 'District Court',
            'created_by' => $admin->id,
        ]);
    } finally {
        TenantContext::clear();
    }

    return compact('tenant', 'admin', 'case');
}

function scheduledHearing(array $ctx, \DateTimeInterface $at): Hearing
{
    TenantContext::set($ctx['tenant']->id);
    try {
        return Hearing::create([
            'tenant_id' => $ctx['tenant']->id,
            'case_id' => $ctx['case']->id,
            'hearing_at' => $at,
            'type' => HearingType::Mention,
            'created_by' => $ctx['admin']->id,
        ]);
    } finally {
        TenantContext::clear();
    }
}

it('registers every recurring job with the scheduler', function (): void {
    $commands = collect(app(Schedule::class)->events())
        ->map(fn ($event): string => (string) $event->command)
        ->implode("\n");

    foreach ([
        'hearings:send-reminders',
        'billing:send-trial-ending-reminders',
        'billing:apply-manual-subscription-changes',
        'ai:grant-monthly-credits',
        'sanctum:prune-expired',
        'workspace:prune-exports',
        'accounts:purge-deleted',
        'backup:clean',
        'backup:run',
        'judiciary:scrape-causelist',
        'app:send-daily-briefing',
    ] as $command) {
        expect($commands)->toContain($command);
    }
});

it('creates hearing reminders for tomorrow across tenants when run by the scheduler', function (): void {
    Queue::fake();

    $a = scheduledTenant('A');
    $b = scheduledTenant('B');
    $tomorrowA = scheduledHearing($a, now()->addDay()->setTime(10, 0));
    $tomorrowB = scheduledHearing($b, now()->addDay()->setTime(11, 30));
    $nextWeek = scheduledHearing($a, now()->addDays(7)->setTime(10, 0));

    $this->artisan('hearings:send-reminders')->assertSuccessful();

    $reminders = CaseNotification::query()
        ->withoutGlobalScopes()
        ->where('notification_type', 'hearing_reminder')
        ->get();

    expect($reminders->pluck('hearing_id')->sort()->values()->all())
        ->toBe(collect([$tomorrowA->id, $tomorrowB->id])->sort()->values()->all());
    expect($reminders->firstWhere('hearing_id', $tomorrowA->id)->user_id)->toBe($a['admin']->id);
    expect($reminders->firstWhere('hearing_id', $tomorrowB->id)->user_id)->toBe($b['admin']->id);
    expect($reminders->pluck('hearing_id'))->not->toContain($nextWeek->id);

    // Running again the same day does not duplicate reminders.
    $this->artisan('hearings:send-reminders')->assertSuccessful();
    expect(CaseNotification::query()->withoutGlobalScopes()->where('notification_type', 'hearing_reminder')->count())
        ->toBe(2);
});

it('runs every scheduled billing and credit command without a request tenant context', function (string $command): void {
    Queue::fake();
    scheduledTenant('A');
    scheduledTenant('B');

    $this->artisan($command)->assertSuccessful();
})->with([
    'billing:send-trial-ending-reminders',
    'billing:apply-manual-subscription-changes',
    'ai:grant-monthly-credits',
]);

it('sends trial-ending reminders in-app and by email at 7, 3 and 1 days', function (int $days): void {
    $ctx = scheduledTenant('Trial');
    $ctx['tenant']->update(['trial_ends_at' => now()->addDays($days)->setTime(12, 0)]);
    $ctx['admin']->update(['email' => 'trial-admin@example.test']);

    $this->artisan('billing:send-trial-ending-reminders')->assertSuccessful();

    $sent = CaseNotification::query()
        ->withoutGlobalScopes()
        ->where('tenant_id', $ctx['tenant']->id)
        ->where('notification_type', "billing_trial_ending_{$days}d")
        ->pluck('channel')
        ->sort()
        ->values()
        ->all();
    expect($sent)->toBe(['email', 'in_app']);

    // Same day re-run does not duplicate.
    $this->artisan('billing:send-trial-ending-reminders')->assertSuccessful();
    expect(CaseNotification::query()->withoutGlobalScopes()->where('tenant_id', $ctx['tenant']->id)->count())->toBe(2);
})->with([7, 3, 1]);

it('does not send trial-ending reminders on other days', function (): void {
    $ctx = scheduledTenant('Trial');
    $ctx['tenant']->update(['trial_ends_at' => now()->addDays(5)->setTime(12, 0)]);

    $this->artisan('billing:send-trial-ending-reminders')->assertSuccessful();

    expect(CaseNotification::query()->withoutGlobalScopes()->where('tenant_id', $ctx['tenant']->id)->count())->toBe(0);
});
