<?php

namespace App\Domain\Notifications\Actions;

use App\Domain\Auth\Actions\RecordAuditLogAction;
use App\Domain\Notifications\Models\CaseNotification;
use Illuminate\Contracts\Auth\Authenticatable;

class DeleteNotificationAction
{
    public function __construct(private readonly RecordAuditLogAction $auditLog)
    {
    }

    public function handle(CaseNotification $notification, ?Authenticatable $user): void
    {
        $notification->delete();

        $this->auditLog->handle(
            'notification.deleted',
            $user,
            CaseNotification::class,
            $notification->public_id
        );
    }
}
