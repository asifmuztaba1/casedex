<?php

namespace App\Console\Commands;

use App\Domain\Billing\Services\PlanFeatureService;
use App\Domain\Notifications\Models\CaseNotification;
use App\Domain\Tenancy\Models\Tenant;
use App\Jobs\DispatchCaseNotificationJob;
use App\Models\User;
use App\Support\TenantContext;
use Illuminate\Console\Command;

class SendTrialEndingReminders extends Command
{
    protected $signature = 'billing:send-trial-ending-reminders';

    protected $description = 'Send trial ending reminders for tenants at 7, 3 and 1 day before trial end.';

    public function handle(PlanFeatureService $planFeatureService): int
    {
        $targetDays = [7, 3, 1];

        Tenant::query()
            ->whereNotNull('trial_ends_at')
            ->chunkById(100, function ($tenants) use ($planFeatureService, $targetDays): void {
                foreach ($tenants as $tenant) {
                    if ($planFeatureService->hasPaidSubscription($tenant)) {
                        continue;
                    }

                    if ($tenant->trial_ends_at === null || $tenant->trial_ends_at->isPast()) {
                        continue;
                    }

                    $daysLeft = now()->startOfDay()->diffInDays($tenant->trial_ends_at->copy()->startOfDay(), false);
                    if (! in_array($daysLeft, $targetDays, true)) {
                        continue;
                    }

                    TenantContext::set($tenant->id);
                    try {
                        $adminUsers = User::query()
                            ->where('tenant_id', $tenant->id)
                            ->where('role', 'admin')
                            ->get(['id']);

                        foreach ($adminUsers as $adminUser) {
                            foreach (['in_app', 'email'] as $channel) {
                                $notificationType = sprintf('billing_trial_ending_%dd', $daysLeft);
                                $alreadySent = CaseNotification::query()
                                    ->where('tenant_id', $tenant->id)
                                    ->where('user_id', $adminUser->id)
                                    ->where('notification_type', $notificationType)
                                    ->whereDate('created_at', now()->toDateString())
                                    ->exists();

                                if ($alreadySent) {
                                    continue;
                                }

                                $notification = CaseNotification::query()->create([
                                    'tenant_id' => $tenant->id,
                                    'case_id' => null,
                                    'user_id' => $adminUser->id,
                                    'hearing_id' => null,
                                    'notification_type' => $notificationType,
                                    'channel' => $channel,
                                    'title' => sprintf('Trial ends in %d day%s', $daysLeft, $daysLeft === 1 ? '' : 's'),
                                    'body' => 'To continue after trial, complete your payment method setup.',
                                    'status' => 'pending',
                                    'scheduled_for' => now(),
                                    'sent_at' => now(),
                                ]);

                                DispatchCaseNotificationJob::dispatch($tenant->id, $notification->id);
                            }
                        }
                    } finally {
                        TenantContext::clear();
                    }
                }
            });

        $this->info('Trial ending reminders processed.');

        return self::SUCCESS;
    }
}
