<?php

namespace App\Domain\Hearings\Actions;

use App\Domain\Hearings\Models\Hearing;

class FindHearingAction
{
    public function handle(string $publicId): Hearing
    {
        return Hearing::query()
            ->where('public_id', $publicId)
            ->firstOrFail();
    }
}
