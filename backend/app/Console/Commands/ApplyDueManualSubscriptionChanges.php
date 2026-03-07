<?php

namespace App\Console\Commands;

use App\Domain\Billing\Actions\ApplyManualSubscriptionChangeRequestAction;
use App\Domain\Billing\Enums\ManualSubscriptionChangeStatus;
use App\Domain\Billing\Models\ManualSubscriptionChangeRequest;
use Illuminate\Console\Command;

class ApplyDueManualSubscriptionChanges extends Command
{
    protected $signature = 'billing:apply-manual-subscription-changes';

    protected $description = 'Apply approved manual subscription lifecycle requests when effective date is reached.';

    public function handle(ApplyManualSubscriptionChangeRequestAction $applyAction): int
    {
        $items = ManualSubscriptionChangeRequest::query()
            ->where('status', ManualSubscriptionChangeStatus::Approved->value)
            ->where('effective_at', '<=', now())
            ->get();

        foreach ($items as $item) {
            $applyAction->handle($item);
        }

        $this->info(sprintf('Applied %d manual subscription lifecycle requests.', $items->count()));

        return self::SUCCESS;
    }
}
