<?php

namespace App\Domain\Courts\Actions;

use App\Domain\Courts\Models\CourtDivision;

class DeleteCourtDivisionAction
{
    public function handle(CourtDivision $division): void
    {
        $division->delete();
    }
}
