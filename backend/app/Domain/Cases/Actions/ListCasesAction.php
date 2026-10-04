<?php

namespace App\Domain\Cases\Actions;

use App\Domain\Cases\Models\CaseFile;
use App\Support\TenantContext;
use Illuminate\Pagination\CursorPaginator;

class ListCasesAction
{
    public function handle(int $perPage, ?string $cursor, ?string $search = null): CursorPaginator
    {
        $search = trim((string) $search);

        return CaseFile::query()
            ->where('tenant_id', TenantContext::id())
            ->when($search !== '', function ($query) use ($search): void {
                // Title, number, court, client or any party: what a lawyer remembers.
                $like = '%'.str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $search).'%';
                $query->where(function ($match) use ($like): void {
                    $match->where('title', 'like', $like)
                        ->orWhere('case_number', 'like', $like)
                        ->orWhere('court', 'like', $like)
                        ->orWhereHas('client', fn ($client) => $client->where('name', 'like', $like))
                        ->orWhereHas('parties', fn ($party) => $party->where('name', 'like', $like));
                });
            })
            ->with('client')
            ->orderByDesc('created_at')
            ->cursorPaginate($perPage, ['*'], 'cursor', $cursor);
    }
}
