<?php

namespace App\Domain\Courts\Actions;

use App\Domain\Courts\Models\CourtType;

class DeleteCourtTypeAction
{
    public function handle(CourtType $type): void
    {
        $type->delete();
    }
}
