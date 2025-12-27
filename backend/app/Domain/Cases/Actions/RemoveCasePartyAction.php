<?php

namespace App\Domain\Cases\Actions;

use App\Domain\Auth\Actions\RecordAuditLogAction;
use App\Domain\Cases\Models\CaseParty;
use Illuminate\Contracts\Auth\Authenticatable;

class RemoveCasePartyAction
{
    public function __construct(private readonly RecordAuditLogAction $auditLog)
    {
    }

    public function handle(CaseParty $party, ?Authenticatable $user): void
    {
        $party->delete();

        $this->auditLog->handle(
            'case.party.removed',
            $user,
            CaseParty::class,
            (string) $party->id
        );
    }
}
