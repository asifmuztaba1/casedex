<?php

use App\Domain\Tenancy\Enums\TenantPlan;

return [
    'trial_days' => (int) env('BILLING_TRIAL_DAYS', 30),

    'storage_limits' => [
        TenantPlan::Starter->value => 1 * 1024 * 1024 * 1024,
        TenantPlan::Professional->value => 5 * 1024 * 1024 * 1024,
        TenantPlan::Chambers->value => 10 * 1024 * 1024 * 1024,
        TenantPlan::Trial->value => 1 * 1024 * 1024 * 1024,
    ],

    'features' => [
        'audit_export' => [
            TenantPlan::Professional->value,
            TenantPlan::Chambers->value,
        ],
        'priority_support' => [
            TenantPlan::Chambers->value,
        ],
    ],

    'variants' => [
        TenantPlan::Starter->value => [
            'monthly' => env('LEMON_SQUEEZY_STARTER_MONTHLY_VARIANT'),
            'yearly' => env('LEMON_SQUEEZY_STARTER_YEARLY_VARIANT'),
        ],
        TenantPlan::Professional->value => [
            'monthly' => env('LEMON_SQUEEZY_PROFESSIONAL_MONTHLY_VARIANT'),
            'yearly' => env('LEMON_SQUEEZY_PROFESSIONAL_YEARLY_VARIANT'),
        ],
        TenantPlan::Chambers->value => [
            'monthly' => env('LEMON_SQUEEZY_CHAMBERS_MONTHLY_VARIANT'),
            'yearly' => env('LEMON_SQUEEZY_CHAMBERS_YEARLY_VARIANT'),
        ],
    ],

    'addons' => [
        'unlimited_storage_variant' => env('LEMON_SQUEEZY_UNLIMITED_STORAGE_VARIANT'),
    ],
];
