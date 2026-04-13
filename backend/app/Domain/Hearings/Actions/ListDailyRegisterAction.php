<?php

namespace App\Domain\Hearings\Actions;

use App\Domain\Hearings\Models\Hearing;
use App\Support\TenantContext;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

class ListDailyRegisterAction
{
    public function handle(Carbon $date, ?int $userId = null): Collection
    {
        $query = Hearing::query()
            ->where('tenant_id', TenantContext::id())
            ->with(['case.parties', 'case.client'])
            ->whereDate('hearing_at', $date)
            ->orderBy('hearing_at');

        if ($userId !== null) {
            $query->whereHas('case.participants', fn ($q) => $q->where('user_id', $userId));
        }

        return $query->get();
    }
}
