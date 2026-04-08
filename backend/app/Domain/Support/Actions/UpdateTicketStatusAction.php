<?php

namespace App\Domain\Support\Actions;

use App\Domain\Notifications\Models\CaseNotification;
use App\Domain\Support\Enums\TicketStatus;
use App\Domain\Support\Models\SupportTicket;
use App\Support\TenantContext;

class UpdateTicketStatusAction
{
    public function handle(SupportTicket $ticket, TicketStatus $status): SupportTicket
    {
        $ticket->update([
            'status' => $status,
            'closed_at' => in_array($status, [TicketStatus::Resolved, TicketStatus::Closed])
                ? now()
                : null,
        ]);

        $this->notifyTicketOwner($ticket, $status);

        return $ticket->fresh();
    }

    private function notifyTicketOwner(SupportTicket $ticket, TicketStatus $status): void
    {
        $ticketOwner = $ticket->user;

        if (! $ticketOwner || ! $ticketOwner->tenant_id) {
            return;
        }

        $statusLabel = match ($status) {
            TicketStatus::Resolved => 'resolved',
            TicketStatus::Closed => 'closed',
            TicketStatus::Open => 'reopened',
            default => null,
        };

        if (! $statusLabel) {
            return;
        }

        $previousTenant = TenantContext::id();
        TenantContext::set($ticketOwner->tenant_id);

        CaseNotification::query()->withoutGlobalScope('tenant')->create([
            'tenant_id' => $ticketOwner->tenant_id,
            'user_id' => $ticketOwner->id,
            'notification_type' => 'support_status',
            'channel' => 'in_app',
            'title' => "Support ticket {$statusLabel}",
            'body' => "Your ticket \"{$ticket->subject}\" has been {$statusLabel}.",
            'status' => 'pending',
            'scheduled_for' => now(),
        ]);

        if ($previousTenant) {
            TenantContext::set($previousTenant);
        } else {
            TenantContext::clear();
        }
    }
}
