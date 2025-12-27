<?php

namespace App\Domain\Courts\Actions;

use App\Domain\Courts\Models\Court;

class DeleteCourtAction
{
    public function handle(Court $court): void
    {
        $court->delete();
    }
}
