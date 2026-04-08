<?php

namespace App\Domain\Support\Actions;

use App\Domain\Support\Enums\TicketStatus;
use App\Domain\Support\Models\SupportTicket;

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

        return $ticket->fresh();
    }
}
