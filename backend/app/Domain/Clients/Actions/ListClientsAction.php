<?php

namespace App\Domain\Clients\Actions;

use App\Domain\Clients\Models\Client;
use App\Support\TenantContext;
use Illuminate\Pagination\CursorPaginator;

class ListClientsAction
{
    public function handle(int $perPage, ?string $cursor): CursorPaginator
    {
        return Client::query()
            ->where('tenant_id', TenantContext::id())
            ->orderBy('created_at')
            ->cursorPaginate($perPage, ['*'], 'cursor', $cursor);
    }
}
