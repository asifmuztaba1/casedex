<?php

namespace App\Domain\Diary\Actions;

use App\Domain\Diary\Models\DiaryEntry;
use App\Support\TenantContext;
use Illuminate\Pagination\CursorPaginator;

class ListDiaryEntriesAction
{
    public function handle(int $perPage, ?string $cursor): CursorPaginator
    {
        return DiaryEntry::query()
            ->where('tenant_id', TenantContext::id())
            ->orderBy('created_at')
            ->cursorPaginate($perPage, ['*'], 'cursor', $cursor);
    }
}
