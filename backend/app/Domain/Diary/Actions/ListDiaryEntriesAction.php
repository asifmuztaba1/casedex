<?php

namespace App\Domain\Diary\Actions;

use App\Domain\Diary\Models\DiaryEntry;
use App\Support\TenantContext;
use Illuminate\Pagination\CursorPaginator;

class ListDiaryEntriesAction
{
    public function handle(int $perPage, ?string $cursor, ?int $caseId = null): CursorPaginator
    {
        $query = DiaryEntry::query()
            ->where('tenant_id', TenantContext::id())
            ->with('case')
            ->orderByDesc('entry_at');

        if ($caseId !== null) {
            $query->where('case_id', $caseId);
        }

        return $query->cursorPaginate($perPage, ['*'], 'cursor', $cursor);
    }
}
