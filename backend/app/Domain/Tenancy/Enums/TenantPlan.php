<?php

namespace App\Domain\Tenancy\Enums;

enum TenantPlan: string
{
    case Free = 'free';
    case Premium = 'premium';
}
