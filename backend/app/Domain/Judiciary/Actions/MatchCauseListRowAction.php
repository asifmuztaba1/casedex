<?php

namespace App\Domain\Judiciary\Actions;

use App\Domain\Cases\Models\CaseFile;
use App\Domain\Judiciary\Dto\CauseListRow;
use Illuminate\Database\Eloquent\Collection;

class MatchCauseListRowAction
{
    /**
     * Find tenant cases that match a scraped cause list row.
     * Relies on TenantContext being set by the caller — the BelongsToTenant
     * global scope on CaseFile enforces tenant isolation.
     *
     * @return Collection<int, CaseFile>
     */
    public function handle(CauseListRow $row, int $courtId): Collection
    {
        return CaseFile::query()
            ->where('court_id', $courtId)
            ->where('registry_case_type_bn', $row->caseTypeBn)
            ->where('registry_case_serial', $row->caseSerial)
            ->where('registry_case_year', $row->caseYear)
            ->with('participants')
            ->get();
    }
}
