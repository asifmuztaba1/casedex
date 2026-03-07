<?php

namespace App\Domain\Billing\Enums;

enum ManualSubscriptionChangeType: string
{
    case Cancel = 'cancel';
    case PlanChange = 'plan_change';
}
