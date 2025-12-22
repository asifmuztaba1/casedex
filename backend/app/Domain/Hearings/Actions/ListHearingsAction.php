<?php

namespace App\Domain\Hearings\Actions;

use App\Domain\Hearings\Models\Hearing;
use App\Support\TenantContext;
use Illuminate\Pagination\CursorPaginator;

class ListHearingsAction
{
    public function handle(int $perPage, ?string $cursor, ?int $caseId = null): CursorPaginator
    {
        $query = Hearing::query()
            ->where('tenant_id', TenantContext::id())
            ->with('case')
            ->orderBy('hearing_at');

        if ($caseId !== null) {
            $query->where('case_id', $caseId);
        }

        return $query->cursorPaginate($perPage, ['*'], 'cursor', $cursor);
    }
}
