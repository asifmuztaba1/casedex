<?php

namespace App\Domain\Billing\Enums;

enum ManualPaymentChannel: string
{
    case Bkash = 'bkash';
    case Rocket = 'rocket';
}
