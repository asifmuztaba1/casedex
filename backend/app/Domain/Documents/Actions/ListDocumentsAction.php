<?php

namespace App\Domain\Documents\Actions;

use App\Domain\Documents\Models\Document;
use App\Support\TenantContext;
use Illuminate\Pagination\CursorPaginator;

class ListDocumentsAction
{
    public function handle(int $perPage, ?string $cursor, ?int $caseId = null): CursorPaginator
    {
        $query = Document::query()
            ->where('tenant_id', TenantContext::id())
            ->with('case')
            ->orderByDesc('created_at');

        if ($caseId !== null) {
            $query->where('case_id', $caseId);
        }

        return $query->cursorPaginate($perPage, ['*'], 'cursor', $cursor);
    }
}
