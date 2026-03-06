<?php

namespace App\Domain\Ai\Listeners;

use App\Domain\Ai\Models\AiCreditLedger;
use App\Domain\Ai\Services\AiCreditService;
use App\Domain\Tenancy\Models\Tenant;
use App\Support\TenantContext;
use LemonSqueezy\Laravel\Events\OrderCreated;

class LemonOrderCreatedListener
{
    public function __construct(private readonly AiCreditService $creditService)
    {
    }

    public function handle(OrderCreated $event): void
    {
        $tenant = $event->billable;
        if (! $tenant instanceof Tenant || $event->order === null) {
            return;
        }

        $pack = $this->creditService->packByVariant((string) $event->order->variant_id);
        if ($pack === null) {
            return;
        }

        TenantContext::set($tenant->id);
        try {
            $alreadyCredited = AiCreditLedger::query()
                ->where('event_type', 'purchase')
                ->whereJsonContains('metadata->order_id', $event->order->id)
                ->exists();

            if ($alreadyCredited) {
                return;
            }
        } finally {
            TenantContext::clear();
        }

        $this->creditService->purchase(
            $tenant,
            null,
            (int) $pack->credits,
            'lemon',
            [
                'order_id' => $event->order->id,
                'order_number' => $event->order->order_number,
                'pack_code' => $pack->code,
                'variant_id' => $event->order->variant_id,
            ]
        );
    }
}
