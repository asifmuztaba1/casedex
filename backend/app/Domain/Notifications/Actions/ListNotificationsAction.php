<?php

namespace App\Domain\Notifications\Actions;

use App\Domain\Notifications\Models\CaseNotification;
use App\Support\TenantContext;
use Illuminate\Pagination\CursorPaginator;

class ListNotificationsAction
{
    public function handle(int $perPage, ?string $cursor): CursorPaginator
    {
        return CaseNotification::query()
            ->where('tenant_id', TenantContext::id())
            ->with('case')
            ->orderByDesc('created_at')
            ->cursorPaginate($perPage, ['*'], 'cursor', $cursor);
    }
}
