<?php

namespace App\Domain\Research\Actions;

use App\Domain\Research\Models\ResearchNote;
use App\Support\TenantContext;
use Illuminate\Pagination\CursorPaginator;

class ListResearchNotesAction
{
    public function handle(int $perPage, ?string $cursor): CursorPaginator
    {
        return ResearchNote::query()
            ->where('tenant_id', TenantContext::id())
            ->orderBy('created_at')
            ->cursorPaginate($perPage, ['*'], 'cursor', $cursor);
    }
}
