<?php

namespace App\Domain\Ai\Enums;

enum AiRequestStatus: string
{
    case Queued = 'queued';
    case Running = 'running';
    case Completed = 'completed';
    case Failed = 'failed';
    case BlockedInsufficientCredits = 'blocked_insufficient_credits';
}
