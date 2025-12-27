<?php

namespace App\Domain\Cases\Actions;

use App\Domain\Cases\Models\CaseParticipant;
use Illuminate\Database\Eloquent\Collection;

class ListCaseParticipantsAction
{
    /**
     * @return Collection<int, CaseParticipant>
     */
    public function handle(int $caseId): Collection
    {
        return CaseParticipant::query()
            ->where('case_id', $caseId)
            ->with('user')
            ->orderBy('created_at')
            ->get();
    }
}
