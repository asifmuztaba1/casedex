<?php

namespace App\Domain\Tenancy\Enums;

enum TenantPlan: string
{
    case Trial = 'trial';
    case Starter = 'starter';
    case Professional = 'professional';
    case Chambers = 'chambers';
}
