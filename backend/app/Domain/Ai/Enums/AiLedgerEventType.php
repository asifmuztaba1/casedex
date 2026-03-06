<?php

namespace App\Domain\Ai\Enums;

enum AiLedgerEventType: string
{
    case FreeGrant = 'free_grant';
    case Purchase = 'purchase';
    case Consume = 'consume';
    case Adjustment = 'adjustment';
    case Expire = 'expire';
    case Refund = 'refund';
}
