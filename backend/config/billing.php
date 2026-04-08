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

    'manual_mfs' => [
        'enabled_country_codes' => ['BD'],
        'currency' => env('BILLING_MANUAL_CURRENCY', 'BDT'),
        'temporary_access_hours' => (int) env('BILLING_MANUAL_TEMPORARY_ACCESS_HOURS', 24),
        'prices' => [
            TenantPlan::Starter->value => [
                'monthly' => (float) env('BILLING_MANUAL_STARTER_MONTHLY', 1900),
                'yearly' => (float) env('BILLING_MANUAL_STARTER_YEARLY', 19000),
            ],
            TenantPlan::Professional->value => [
                'monthly' => (float) env('BILLING_MANUAL_PROFESSIONAL_MONTHLY', 4900),
                'yearly' => (float) env('BILLING_MANUAL_PROFESSIONAL_YEARLY', 49000),
            ],
            TenantPlan::Chambers->value => [
                'monthly' => (float) env('BILLING_MANUAL_CHAMBERS_MONTHLY', 9900),
                'yearly' => (float) env('BILLING_MANUAL_CHAMBERS_YEARLY', 99000),
            ],
        ],
    ],

    'ai' => [
        'monthly_free_credits' => (int) env('AI_MONTHLY_FREE_CREDITS', 100),
        'feature_costs' => [
            'hearing_summary' => (int) env('AI_COST_HEARING_SUMMARY', 4),
            'diary_summary' => (int) env('AI_COST_DIARY_SUMMARY', 3),
            'research_summary' => (int) env('AI_COST_RESEARCH_SUMMARY', 5),
            'document_qa' => (int) env('AI_COST_DOCUMENT_QA', 2),
            'petition_draft' => (int) env('AI_COST_PETITION_DRAFT', 8),
            'legal_section_lookup' => (int) env('AI_COST_LEGAL_SECTION_LOOKUP', 3),
            'case_law_suggestion' => (int) env('AI_COST_CASE_LAW_SUGGESTION', 5),
            'next_steps' => (int) env('AI_COST_NEXT_STEPS', 4),
            'client_communication' => (int) env('AI_COST_CLIENT_COMMUNICATION', 3),
        ],
        'packs' => [
            'small' => [
                'name' => env('AI_PACK_SMALL_NAME', 'Small AI Pack'),
                'credits' => (int) env('AI_PACK_SMALL_CREDITS', 100),
                'price_usd_cents' => (int) env('AI_PACK_SMALL_PRICE_USD_CENTS', 900),
                'price_bdt' => (float) env('AI_PACK_SMALL_PRICE_BDT', 999),
                'lemon_variant_id' => env('LEMON_SQUEEZY_AI_PACK_SMALL_VARIANT'),
                'sort_order' => 10,
            ],
            'medium' => [
                'name' => env('AI_PACK_MEDIUM_NAME', 'Medium AI Pack'),
                'credits' => (int) env('AI_PACK_MEDIUM_CREDITS', 300),
                'price_usd_cents' => (int) env('AI_PACK_MEDIUM_PRICE_USD_CENTS', 2400),
                'price_bdt' => (float) env('AI_PACK_MEDIUM_PRICE_BDT', 2799),
                'lemon_variant_id' => env('LEMON_SQUEEZY_AI_PACK_MEDIUM_VARIANT'),
                'sort_order' => 20,
            ],
            'large' => [
                'name' => env('AI_PACK_LARGE_NAME', 'Large AI Pack'),
                'credits' => (int) env('AI_PACK_LARGE_CREDITS', 800),
                'price_usd_cents' => (int) env('AI_PACK_LARGE_PRICE_USD_CENTS', 5600),
                'price_bdt' => (float) env('AI_PACK_LARGE_PRICE_BDT', 6499),
                'lemon_variant_id' => env('LEMON_SQUEEZY_AI_PACK_LARGE_VARIANT'),
                'sort_order' => 30,
            ],
        ],
        'default_alert_thresholds' => [
            (int) env('AI_ALERT_THRESHOLD_LOW', 50),
            (int) env('AI_ALERT_THRESHOLD_CRITICAL', 15),
        ],
    ],
];
