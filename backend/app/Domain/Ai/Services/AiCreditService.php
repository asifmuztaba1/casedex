<?php

namespace App\Domain\Ai\Services;

use App\Domain\Ai\Enums\AiFeature;
use App\Domain\Ai\Enums\AiLedgerEventType;
use App\Domain\Ai\Models\AiAlertRule;
use App\Domain\Ai\Models\AiCreditLedger;
use App\Domain\Ai\Models\AiCreditPack;
use App\Domain\Ai\Models\AiCreditWallet;
use App\Domain\Auth\Actions\RecordAuditLogAction;
use App\Domain\Notifications\Models\CaseNotification;
use App\Domain\Tenancy\Models\Tenant;
use App\Jobs\DispatchCaseNotificationJob;
use App\Models\User;
use App\Support\TenantContext;
use Illuminate\Support\Arr;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class AiCreditService
{
    public function __construct(private readonly RecordAuditLogAction $auditLog)
    {
    }

    public function monthlyFreeCredits(): int
    {
        return (int) config('billing.ai.monthly_free_credits', 100);
    }

    public function featureCost(AiFeature $feature): int
    {
        return max(1, (int) Arr::get(config('billing.ai.feature_costs', []), $feature->value, 1));
    }

    public function getOrCreateWallet(Tenant $tenant): AiCreditWallet
    {
        $wallet = AiCreditWallet::query()->firstOrCreate(
            ['tenant_id' => $tenant->id],
            [
                'free_balance' => 0,
                'paid_balance' => 0,
                'monthly_free_credits' => $this->monthlyFreeCredits(),
            ]
        );

        $this->grantMonthlyIfDue($tenant);

        return $wallet->fresh();
    }

    public function grantMonthlyIfDue(Tenant $tenant, ?Carbon $now = null): AiCreditWallet
    {
        $now = $now ?? now();

        return DB::transaction(function () use ($tenant, $now): AiCreditWallet {
            $wallet = AiCreditWallet::query()
                ->where('tenant_id', $tenant->id)
                ->lockForUpdate()
                ->first();

            if ($wallet === null) {
                $wallet = AiCreditWallet::query()->create([
                    'tenant_id' => $tenant->id,
                    'monthly_free_credits' => $this->monthlyFreeCredits(),
                ]);
                $wallet = AiCreditWallet::query()->where('id', $wallet->id)->lockForUpdate()->firstOrFail();
            }

            $monthlyCredits = $wallet->monthly_free_credits > 0 ? $wallet->monthly_free_credits : $this->monthlyFreeCredits();
            $needsGrant = $wallet->next_free_grant_at === null || $wallet->next_free_grant_at->lessThanOrEqualTo($now);

            if (! $needsGrant) {
                return $wallet;
            }

            if ($wallet->free_balance > 0) {
                $expired = $wallet->free_balance;
                $wallet->free_balance = 0;

                $this->appendLedger(
                    tenantId: $tenant->id,
                    userId: null,
                    eventType: AiLedgerEventType::Expire,
                    feature: null,
                    creditsDelta: -$expired,
                    freeDelta: -$expired,
                    paidDelta: 0,
                    freeBalanceAfter: $wallet->free_balance,
                    paidBalanceAfter: $wallet->paid_balance,
                    metadata: ['reason' => 'monthly_rollover']
                );
            }

            $cycleStart = $now->copy()->startOfDay();
            $cycleEnd = $cycleStart->copy()->addMonth();

            $wallet->fill([
                'monthly_free_credits' => $monthlyCredits,
                'free_balance' => $monthlyCredits,
                'cycle_starts_at' => $cycleStart,
                'cycle_ends_at' => $cycleEnd,
                'next_free_grant_at' => $cycleEnd,
            ]);
            $wallet->save();

            $this->appendLedger(
                tenantId: $tenant->id,
                userId: null,
                eventType: AiLedgerEventType::FreeGrant,
                feature: null,
                creditsDelta: $monthlyCredits,
                freeDelta: $monthlyCredits,
                paidDelta: 0,
                freeBalanceAfter: $wallet->free_balance,
                paidBalanceAfter: $wallet->paid_balance,
                metadata: [
                    'cycle_starts_at' => $cycleStart->toIso8601String(),
                    'cycle_ends_at' => $cycleEnd->toIso8601String(),
                ]
            );

            $this->auditWithTenant($tenant->id, 'billing.ai.free_grant', null, [
                'credits' => $monthlyCredits,
            ]);

            return $wallet;
        });
    }

    /**
     * @param array<string, mixed> $metadata
     * @return array{wallet: AiCreditWallet, spent_free: int, spent_paid: int}
     */
    public function consume(
        Tenant $tenant,
        ?User $user,
        AiFeature $feature,
        int $credits,
        array $metadata = []
    ): array {
        return DB::transaction(function () use ($tenant, $user, $feature, $credits, $metadata): array {
            $wallet = $this->grantMonthlyIfDue($tenant);

            $wallet = AiCreditWallet::query()
                ->where('id', $wallet->id)
                ->lockForUpdate()
                ->firstOrFail();

            $available = $wallet->free_balance + $wallet->paid_balance;
            if ($available < $credits) {
                throw new \RuntimeException('insufficient_credits');
            }

            $spentFree = min($wallet->free_balance, $credits);
            $remaining = $credits - $spentFree;
            $spentPaid = min($wallet->paid_balance, $remaining);

            $wallet->free_balance -= $spentFree;
            $wallet->paid_balance -= $spentPaid;
            $wallet->save();

            $this->appendLedger(
                tenantId: $tenant->id,
                userId: $user?->id,
                eventType: AiLedgerEventType::Consume,
                feature: $feature->value,
                creditsDelta: -$credits,
                freeDelta: -$spentFree,
                paidDelta: -$spentPaid,
                freeBalanceAfter: $wallet->free_balance,
                paidBalanceAfter: $wallet->paid_balance,
                metadata: $metadata
            );

            $this->auditWithTenant($tenant->id, 'billing.ai.consume', $user, [
                'feature' => $feature->value,
                'credits' => $credits,
            ]);

            $this->checkAndTriggerAlerts($tenant, $wallet, $user);

            return [
                'wallet' => $wallet,
                'spent_free' => $spentFree,
                'spent_paid' => $spentPaid,
            ];
        });
    }

    /**
     * @param array<string, mixed> $metadata
     */
    public function refund(
        Tenant $tenant,
        ?User $user,
        AiFeature $feature,
        int $freeCredits,
        int $paidCredits,
        array $metadata = []
    ): AiCreditWallet {
        $total = $freeCredits + $paidCredits;

        return DB::transaction(function () use ($tenant, $user, $feature, $freeCredits, $paidCredits, $total, $metadata): AiCreditWallet {
            $wallet = $this->grantMonthlyIfDue($tenant);
            $wallet = AiCreditWallet::query()->where('id', $wallet->id)->lockForUpdate()->firstOrFail();

            $wallet->free_balance += $freeCredits;
            $wallet->paid_balance += $paidCredits;
            $wallet->save();

            $this->appendLedger(
                tenantId: $tenant->id,
                userId: $user?->id,
                eventType: AiLedgerEventType::Refund,
                feature: $feature->value,
                creditsDelta: $total,
                freeDelta: $freeCredits,
                paidDelta: $paidCredits,
                freeBalanceAfter: $wallet->free_balance,
                paidBalanceAfter: $wallet->paid_balance,
                metadata: $metadata
            );

            $this->auditWithTenant($tenant->id, 'billing.ai.refund', $user, [
                'feature' => $feature->value,
                'credits' => $total,
            ]);

            return $wallet;
        });
    }

    /**
     * @param array<string, mixed> $metadata
     */
    public function purchase(
        Tenant $tenant,
        ?User $user,
        int $credits,
        string $source,
        array $metadata = []
    ): AiCreditWallet {
        return DB::transaction(function () use ($tenant, $user, $credits, $source, $metadata): AiCreditWallet {
            $wallet = $this->grantMonthlyIfDue($tenant);
            $wallet = AiCreditWallet::query()->where('id', $wallet->id)->lockForUpdate()->firstOrFail();

            $wallet->paid_balance += $credits;
            $wallet->save();

            $this->appendLedger(
                tenantId: $tenant->id,
                userId: $user?->id,
                eventType: AiLedgerEventType::Purchase,
                feature: null,
                creditsDelta: $credits,
                freeDelta: 0,
                paidDelta: $credits,
                freeBalanceAfter: $wallet->free_balance,
                paidBalanceAfter: $wallet->paid_balance,
                metadata: array_merge($metadata, ['source' => $source])
            );

            $this->auditWithTenant($tenant->id, 'billing.ai.purchase', $user, [
                'source' => $source,
                'credits' => $credits,
            ]);

            return $wallet;
        });
    }

    public function walletSummary(Tenant $tenant): array
    {
        $wallet = $this->getOrCreateWallet($tenant);

        return [
            'free_balance' => $wallet->free_balance,
            'paid_balance' => $wallet->paid_balance,
            'total_balance' => $wallet->free_balance + $wallet->paid_balance,
            'monthly_free_credits' => $wallet->monthly_free_credits,
            'cycle_starts_at' => $wallet->cycle_starts_at,
            'cycle_ends_at' => $wallet->cycle_ends_at,
            'next_free_grant_at' => $wallet->next_free_grant_at,
        ];
    }

    public function packByCode(string $code): ?AiCreditPack
    {
        return AiCreditPack::query()
            ->where('code', $code)
            ->where('active', true)
            ->first();
    }

    public function packByVariant(string $variantId): ?AiCreditPack
    {
        return AiCreditPack::query()
            ->where('lemon_variant_id', $variantId)
            ->where('active', true)
            ->first();
    }

    private function appendLedger(
        int $tenantId,
        ?int $userId,
        AiLedgerEventType $eventType,
        ?string $feature,
        int $creditsDelta,
        int $freeDelta,
        int $paidDelta,
        int $freeBalanceAfter,
        int $paidBalanceAfter,
        ?array $metadata
    ): void {
        TenantContext::set($tenantId);

        try {
            AiCreditLedger::query()->create([
                'tenant_id' => $tenantId,
                'user_id' => $userId,
                'event_type' => $eventType->value,
                'feature' => $feature,
                'credits_delta' => $creditsDelta,
                'free_delta' => $freeDelta,
                'paid_delta' => $paidDelta,
                'free_balance_after' => $freeBalanceAfter,
                'paid_balance_after' => $paidBalanceAfter,
                'metadata' => $metadata,
            ]);
        } finally {
            TenantContext::clear();
        }
    }

    private function auditWithTenant(int $tenantId, string $action, ?User $user, array $metadata = []): void
    {
        TenantContext::set($tenantId);

        try {
            $this->auditLog->handle($action, $user, null, null, $metadata);
        } finally {
            TenantContext::clear();
        }
    }

    private function checkAndTriggerAlerts(Tenant $tenant, AiCreditWallet $wallet, ?User $actor): void
    {
        $total = $wallet->free_balance + $wallet->paid_balance;

        TenantContext::set($tenant->id);

        try {
            $rules = AiAlertRule::query()
                ->where('is_active', true)
                ->where('threshold_credits', '>=', $total)
                ->get();

            if ($rules->isEmpty()) {
                return;
            }

            $adminUsers = User::query()->where('tenant_id', $tenant->id)->where('role', 'admin')->get(['id']);

            foreach ($rules as $rule) {
                if ($rule->last_triggered_at !== null && $rule->last_triggered_at->isAfter(now()->subHours(24))) {
                    continue;
                }

                foreach ($adminUsers as $adminUser) {
                    if ($rule->channel_in_app) {
                        $notification = CaseNotification::query()->create([
                            'tenant_id' => $tenant->id,
                            'case_id' => null,
                            'user_id' => $adminUser->id,
                            'hearing_id' => null,
                            'notification_type' => 'ai_credit_threshold_reached',
                            'channel' => 'in_app',
                            'title' => 'AI credit balance is low',
                            'body' => sprintf('AI credits dropped to %d. Consider topping up.', $total),
                            'status' => 'pending',
                            'scheduled_for' => now(),
                            'sent_at' => now(),
                        ]);

                        DispatchCaseNotificationJob::dispatch($tenant->id, $notification->id);
                    }

                    if ($rule->channel_email) {
                        $notification = CaseNotification::query()->create([
                            'tenant_id' => $tenant->id,
                            'case_id' => null,
                            'user_id' => $adminUser->id,
                            'hearing_id' => null,
                            'notification_type' => 'ai_credit_threshold_reached',
                            'channel' => 'email',
                            'title' => 'AI credit balance is low',
                            'body' => sprintf('AI credits dropped to %d. Consider topping up.', $total),
                            'status' => 'pending',
                            'scheduled_for' => now(),
                            'sent_at' => now(),
                        ]);

                        DispatchCaseNotificationJob::dispatch($tenant->id, $notification->id);
                    }
                }

                $rule->last_triggered_at = now();
                $rule->save();
            }

            $this->auditLog->handle('billing.ai.alert_triggered', $actor, null, null, ['total' => $total]);
        } finally {
            TenantContext::clear();
        }
    }
}
