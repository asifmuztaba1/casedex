<?php

namespace App\Domain\Hearings\Actions;

use App\Domain\Hearings\Models\Hearing;
use App\Support\TenantContext;
use Illuminate\Pagination\CursorPaginator;

class ListHearingsAction
{
    public function handle(int $perPage, ?string $cursor): CursorPaginator
    {
        return Hearing::query()
            ->where('tenant_id', TenantContext::id())
            ->orderBy('created_at')
            ->cursorPaginate($perPage, ['*'], 'cursor', $cursor);
    }
}
