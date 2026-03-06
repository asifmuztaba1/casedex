<?php

namespace App\Domain\Billing\Enums;

enum ManualPaymentRequestStatus: string
{
    case Pending = 'pending';
    case Approved = 'approved';
    case Rejected = 'rejected';
    case Expired = 'expired';
}
