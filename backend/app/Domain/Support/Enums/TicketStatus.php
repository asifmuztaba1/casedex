<?php

namespace App\Domain\Support\Enums;

enum TicketStatus: string
{
    case Open = 'open';
    case AwaitingReply = 'awaiting_reply';
    case Resolved = 'resolved';
    case Closed = 'closed';
}
