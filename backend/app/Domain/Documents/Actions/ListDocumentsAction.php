<?php

namespace App\Domain\Documents\Actions;

use App\Domain\Documents\Models\Document;
use App\Support\TenantContext;
use Illuminate\Pagination\CursorPaginator;

class ListDocumentsAction
{
    public function handle(int $perPage, ?string $cursor): CursorPaginator
    {
        return Document::query()
            ->where('tenant_id', TenantContext::id())
            ->orderBy('created_at')
            ->cursorPaginate($perPage, ['*'], 'cursor', $cursor);
    }
}
