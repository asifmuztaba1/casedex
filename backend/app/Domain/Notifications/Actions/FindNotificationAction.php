<?php

namespace App\Domain\Notifications\Actions;

use App\Domain\Notifications\Models\CaseNotification;

class FindNotificationAction
{
    public function handle(string $publicId): CaseNotification
    {
        return CaseNotification::query()
            ->where('public_id', $publicId)
            ->firstOrFail();
    }
}
