<?php

namespace App\Domain\Billing\Enums;

enum ManualSubscriptionChangeStatus: string
{
    case Pending = 'pending';
    case Approved = 'approved';
    case Rejected = 'rejected';
    case Applied = 'applied';
}
