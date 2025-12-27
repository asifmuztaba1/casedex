<?php

namespace App\Domain\Cases\Actions;

use App\Domain\Cases\Models\CaseParty;
use Illuminate\Support\Collection;

class ListCasePartiesAction
{
    /**
     * @return Collection<int, CaseParty>
     */
    public function handle(int $caseId): Collection
    {
        return CaseParty::query()
            ->where('case_id', $caseId)
            ->orderBy('side')
            ->orderBy('name')
            ->get();
    }
}
