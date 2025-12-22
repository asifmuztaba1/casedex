<?php

namespace App\Domain\Cases\Actions;

use App\Domain\Cases\Models\CaseFile;
use App\Support\TenantContext;
use Illuminate\Pagination\CursorPaginator;

class ListCasesAction
{
    public function handle(int $perPage, ?string $cursor): CursorPaginator
    {
        return CaseFile::query()
            ->where('tenant_id', TenantContext::id())
            ->with('client')
            ->orderByDesc('created_at')
            ->cursorPaginate($perPage, ['*'], 'cursor', $cursor);
    }
}
