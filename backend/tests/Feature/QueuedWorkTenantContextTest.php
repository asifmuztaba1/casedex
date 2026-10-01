<?php

use App\Domain\Auth\Enums\UserRole;
use App\Domain\Cases\Models\CaseFile;
use App\Domain\Cases\Models\CaseParty;
use App\Domain\Hearings\Enums\HearingType;
use App\Domain\Hearings\Models\Hearing;
use App\Domain\Notifications\Models\CaseNotification;
use App\Domain\Tenancy\Enums\TenantPlan;
use App\Domain\Tenancy\Models\Tenant;
use App\Jobs\DispatchCaseNotificationJob;
use App\Jobs\SendHearingReminderJob;
use App\Mail\CasePartyAddedMail;
use App\Models\User;
use App\Support\TenantContext;
use Illuminate\Foundation\Testing\RefreshDatabase;

/*
 * Queue workers run jobs and queued mail with no request, so no tenant
 * context is set. These tests run that work the same way and render the
 * mail for real (array mailer), which is what touches tenant-scoped models.
 */

uses(RefreshDatabase::class);

/**
 * @return array{tenant: Tenant, user: User, case: CaseFile, hearing: Hearing}
 */
function queuedWorkFixture(): array
{
    $tenant = Tenant::factory()->create([
        'plan' => TenantPlan::Professional,
        'trial_ends_at' => now()->addDays(30),
    ]);
    $user = User::factory()->create([
        'tenant_id' => $tenant->id,
        'role' => UserRole::Admin,
        'email' => 'advocate@example.test',
    ]);

    TenantContext::set($tenant->id);
    try {
        $case = CaseFile::create([
            'tenant_id' => $tenant->id,
            'title' => 'State v. Queue',
            'court' => 'Dhaka CMM Court',
            'created_by' => $user->id,
        ]);
        $hearing = Hearing::create([
            'tenant_id' => $tenant->id,
            'case_id' => $case->id,
            'hearing_at' => now()->addDay()->setTime(10, 0),
            'type' => HearingType::Mention,
            'created_by' => $user->id,
        ]);
    } finally {
        TenantContext::clear();
    }

    return compact('tenant', 'user', 'case', 'hearing');
}

function notificationFor(array $ctx, string $type, string $channel): CaseNotification
{
    TenantContext::set($ctx['tenant']->id);
    try {
        return CaseNotification::create([
            'tenant_id' => $ctx['tenant']->id,
            'case_id' => $ctx['case']->id,
            'user_id' => $ctx['user']->id,
            'hearing_id' => $ctx['hearing']->id,
            'notification_type' => $type,
            'channel' => $channel,
            'title' => 'Hearing reminder',
            'body' => 'Reminder: hearing scheduled for tomorrow.',
            'status' => 'pending',
            'scheduled_for' => now(),
        ]);
    } finally {
        TenantContext::clear();
    }
}

/**
 * @return array<int, string>
 */
function sentMailBodies(): array
{
    return collect(app('mailer')->getSymfonyTransport()->messages())
        ->map(fn ($sent): string => $sent->getOriginalMessage()->getHtmlBody() ?? '')
        ->all();
}

it('sends the hearing reminder email from a queue worker', function (): void {
    $ctx = queuedWorkFixture();
    $notification = notificationFor($ctx, 'hearing_reminder', 'in_app');

    (new SendHearingReminderJob($ctx['tenant']->id, $notification->id))->handle();

    expect(sentMailBodies())->toHaveCount(1);
    expect(sentMailBodies()[0])->toContain('State v. Queue');
    expect($notification->fresh()->status)->toBe('sent');
});

it('sends case notification emails from a queue worker', function (): void {
    $ctx = queuedWorkFixture();
    $notification = notificationFor($ctx, 'case_update', 'email');

    (new DispatchCaseNotificationJob($ctx['tenant']->id, $notification->id))->handle();

    expect(sentMailBodies())->toHaveCount(1);
    expect(sentMailBodies()[0])->toContain('State v. Queue');
});

it('renders the queued party-added email after it is restored by a worker', function (): void {
    $ctx = queuedWorkFixture();

    TenantContext::set($ctx['tenant']->id);
    try {
        $party = CaseParty::create([
            'case_id' => $ctx['case']->id,
            'type' => 'person',
            'name' => 'Opposing Party',
            'side' => 'opponent',
            'role' => 'respondent',
            'email' => 'party@example.test',
        ]);
        $mail = new CasePartyAddedMail($ctx['case']->load('parties'), $party, $ctx['user']);
        $payload = serialize($mail);
    } finally {
        TenantContext::clear();
    }

    // What the worker does: unserialize (restoring models), then render.
    $restored = unserialize($payload);

    expect($restored->render())->toContain('State v. Queue');
});
