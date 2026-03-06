<?php

namespace App\Domain\Billing\Listeners;

use App\Domain\Auth\Enums\UserRole;
use App\Domain\Notifications\Models\CaseNotification;
use App\Domain\Tenancy\Models\Tenant;
use App\Jobs\DispatchCaseNotificationJob;
use LemonSqueezy\Laravel\Events\SubscriptionPaymentFailed;

class SubscriptionPaymentFailedListener
{
    public function handle(SubscriptionPaymentFailed $event): void
    {
        if (! $event->billable instanceof Tenant) {
            return;
        }

        $admins = $event->billable->users()
            ->where('role', UserRole::Admin->value)
            ->get(['id']);

        foreach ($admins as $admin) {
            $notification = CaseNotification::query()->create([
                'tenant_id' => $event->billable->id,
                'case_id' => null,
                'user_id' => $admin->id,
                'hearing_id' => null,
                'notification_type' => 'billing_payment_failed',
                'channel' => 'in_app',
                'title' => 'Payment failed',
                'body' => 'Subscription payment failed. Please update billing details to keep workspace access.',
                'status' => 'pending',
                'scheduled_for' => now(),
            ]);

            DispatchCaseNotificationJob::dispatch($event->billable->id, $notification->id);
        }
    }
}
