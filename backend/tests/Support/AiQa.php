<?php

use App\Domain\Ai\Models\AiAlertRule;
use App\Domain\Ai\Models\AiCreditPack;
use App\Domain\Auth\Enums\UserRole;
use App\Domain\Billing\Enums\ManualPaymentChannel;
use App\Domain\Billing\Models\ManualPaymentMethod;
use App\Domain\Tenancy\Enums\TenantPlan;
use App\Domain\Tenancy\Models\Country;
use App\Domain\Tenancy\Models\Tenant;
use App\Models\User;

function createAiQaCountry(string $countryCode = 'BD'): Country
{
    return Country::query()->firstOrCreate(
        ['code' => strtoupper($countryCode)],
        [
            'name' => strtoupper($countryCode),
            'active' => true,
        ]
    );
}

/**
 * @return array{0: Tenant, 1: User}
 */
function createAiQaTenantUser(
    string $countryCode = 'BD',
    UserRole $role = UserRole::Admin,
    bool $withActiveSubscription = true,
    TenantPlan $plan = TenantPlan::Starter,
): array {
    $country = createAiQaCountry($countryCode);

    $tenant = Tenant::factory()->create([
        'country_id' => $country->id,
        'plan' => $plan,
        'trial_ends_at' => $withActiveSubscription ? now()->subDay() : now()->subDay(),
        'locale' => $countryCode === 'BD' ? 'bn' : 'en',
    ]);

    if ($withActiveSubscription) {
        $tenant->subscriptions()->create([
            'type' => 'default',
            'lemon_squeezy_id' => 'sub_'.$tenant->public_id,
            'status' => 'active',
            'product_id' => 'prod_ai_qs',
            'variant_id' => 'var_ai_qs',
            'trial_ends_at' => null,
            'renews_at' => now()->addMonth(),
            'ends_at' => null,
        ]);
    }

    $user = User::factory()->create([
        'tenant_id' => $tenant->id,
        'country_id' => $country->id,
        'role' => $role,
    ]);

    return [$tenant, $user];
}

function createAiQaPlatformAdmin(): User
{
    return User::factory()->create([
        'tenant_id' => null,
        'country_id' => createAiQaCountry('BD')->id,
        'role' => UserRole::PlatformAdmin,
    ]);
}

function seedAiQaCreditPack(array $overrides = []): AiCreditPack
{
    return AiCreditPack::query()->create(array_merge([
        'code' => 'qa-small',
        'name' => 'QA Small Pack',
        'credits' => 100,
        'price_usd_cents' => 900,
        'price_bdt' => 999,
        'lemon_variant_id' => null,
        'active' => true,
        'sort_order' => 10,
    ], $overrides));
}

function seedAiQaManualMethod(array $overrides = []): ManualPaymentMethod
{
    return ManualPaymentMethod::query()->create(array_merge([
        'channel' => ManualPaymentChannel::Bkash,
        'account_name' => 'CaseDex QA',
        'receiver_number' => '01700000000',
        'instructions_en' => 'Send payment and upload proof.',
        'instructions_bn' => 'পেমেন্ট পাঠিয়ে প্রমাণ আপলোড করুন।',
        'active' => true,
        'sort_order' => 10,
    ], $overrides));
}

function seedAiQaAlertRule(Tenant $tenant, array $overrides = []): AiAlertRule
{
    return AiAlertRule::query()->create(array_merge([
        'tenant_id' => $tenant->id,
        'threshold_credits' => 50,
        'channel_in_app' => true,
        'channel_email' => false,
        'is_active' => true,
        'created_by' => null,
        'updated_by' => null,
        'last_triggered_at' => null,
    ], $overrides));
}
