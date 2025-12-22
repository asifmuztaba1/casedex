<?php

namespace App\Domain\Hearings\Actions;

use App\Domain\Auth\Actions\RecordAuditLogAction;
use App\Domain\Hearings\Models\Hearing;
use Illuminate\Contracts\Auth\Authenticatable;

class DeleteHearingAction
{
    public function __construct(private readonly RecordAuditLogAction $auditLog)
    {
    }

    public function handle(Hearing $hearing, ?Authenticatable $user): void
    {
        $hearing->delete();

        $this->auditLog->handle(
            'hearing.deleted',
            $user,
            Hearing::class,
            $hearing->public_id
        );
    }
}
