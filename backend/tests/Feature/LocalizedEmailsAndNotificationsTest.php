<?php

use App\Domain\Auth\Enums\UserRole;
use App\Domain\Cases\Models\CaseFile;
use App\Domain\Hearings\Enums\HearingType;
use App\Domain\Hearings\Models\Hearing;
use App\Domain\Notifications\Models\CaseNotification;
use App\Domain\Tenancy\Enums\TenantPlan;
use App\Domain\Tenancy\Models\Tenant;
use App\Mail\VerifyEmailMail;
use App\Models\User;
use App\Support\TenantContext;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

/**
 * @return array{tenant: Tenant, user: User, case: CaseFile}
 */
function localizedTenant(string $locale): array
{
    $tenant = Tenant::factory()->create([
        'plan' => TenantPlan::Professional,
        'trial_ends_at' => now()->addDays(30),
    ]);
    $user = User::factory()->create([
        'tenant_id' => $tenant->id,
        'role' => UserRole::Admin,
        'locale' => $locale,
        'email' => "{$locale}-admin@example.test",
    ]);

    TenantContext::set($tenant->id);
    try {
        $case = CaseFile::create([
            'tenant_id' => $tenant->id,
            'title' => 'State v. Locale',
            'court' => 'Dhaka CMM Court',
            'created_by' => $user->id,
        ]);
        Hearing::create([
            'tenant_id' => $tenant->id,
            'case_id' => $case->id,
            'hearing_at' => now()->addDay()->setTime(10, 30),
            'type' => HearingType::Mention,
            'created_by' => $user->id,
        ]);
    } finally {
        TenantContext::clear();
    }

    return compact('tenant', 'user', 'case');
}

/**
 * @return array<int, array{subject: string, html: string}>
 */
function sentMails(): array
{
    return collect(app('mailer')->getSymfonyTransport()->messages())
        ->map(fn ($sent): array => [
            'subject' => (string) $sent->getOriginalMessage()->getSubject(),
            'html' => (string) $sent->getOriginalMessage()->getHtmlBody(),
        ])
        ->all();
}

it('writes hearing reminders in Bangla for Bangla users, email included', function (): void {
    $ctx = localizedTenant('bn');

    // Queue is sync in tests, so the reminder email is sent immediately.
    $this->artisan('hearings:send-reminders')->assertSuccessful();

    $notification = CaseNotification::query()->withoutGlobalScopes()
        ->where('tenant_id', $ctx['tenant']->id)
        ->where('notification_type', 'hearing_reminder')
        ->first();
    expect($notification->title)->toBe('শুনানির রিমাইন্ডার');
    expect($notification->body)->toBe('রিমাইন্ডার: আগামীকাল শুনানি আছে।');

    $mail = sentMails()[0];
    expect($mail['subject'])->toBe('শুনানির রিমাইন্ডার');
    expect($mail['html'])->toContain('আগামীকাল একটি শুনানি আছে।')
        ->toContain('State v. Locale')
        ->toContain('১০:৩০')
        ->toContain('lang="bn"')
        ->not->toContain('A hearing is scheduled');
});

it('keeps hearing reminders in English for English users', function (): void {
    localizedTenant('en');

    $this->artisan('hearings:send-reminders')->assertSuccessful();

    $mail = sentMails()[0];
    expect($mail['subject'])->toBe('Hearing reminder');
    expect($mail['html'])->toContain('A hearing is scheduled for tomorrow.')->toContain('10:30');
});

it('writes trial-ending reminders in the admin language with Bangla digits', function (): void {
    $bn = localizedTenant('bn');
    $bn['tenant']->update(['trial_ends_at' => now()->addDays(3)->setTime(12, 0)]);
    $en = localizedTenant('en');
    $en['tenant']->update(['trial_ends_at' => now()->addDays(1)->setTime(12, 0)]);

    $this->artisan('billing:send-trial-ending-reminders')->assertSuccessful();

    $titleFor = fn (Tenant $tenant): ?string => CaseNotification::query()->withoutGlobalScopes()
        ->where('tenant_id', $tenant->id)->where('channel', 'in_app')->value('title');

    expect($titleFor($bn['tenant']))->toBe('ট্রায়াল শেষ হতে ৩ দিন বাকি');
    expect($titleFor($en['tenant']))->toBe('Trial ends in 1 day');
});

it('sends account emails in the user language', function (): void {
    $bnUser = User::factory()->create(['locale' => 'bn', 'email' => 'bn-user@example.test']);
    $enUser = User::factory()->create(['locale' => 'en', 'email' => 'en-user@example.test']);

    \Illuminate\Support\Facades\Mail::to($bnUser->email)->send(new VerifyEmailMail($bnUser, 'https://example.test/verify'));
    \Illuminate\Support\Facades\Mail::to($enUser->email)->send(new VerifyEmailMail($enUser, 'https://example.test/verify'));

    [$bnMail, $enMail] = sentMails();
    expect($bnMail['subject'])->toBe('আপনার CaseDex™ ইমেইল যাচাই করুন');
    expect($bnMail['html'])->toContain('ইমেইল যাচাই করুন');
    expect($enMail['subject'])->toBe('Verify your CaseDex™ email');
});
