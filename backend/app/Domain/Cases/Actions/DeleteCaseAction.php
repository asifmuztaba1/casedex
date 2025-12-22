<?php

namespace App\Domain\Cases\Actions;

use App\Domain\Auth\Actions\RecordAuditLogAction;
use App\Domain\Cases\Models\CaseFile;
use Illuminate\Contracts\Auth\Authenticatable;

class DeleteCaseAction
{
    public function __construct(private readonly RecordAuditLogAction $auditLog)
    {
    }

    public function handle(CaseFile $case, ?Authenticatable $user): void
    {
        $case->delete();

        $this->auditLog->handle(
            'case.deleted',
            $user,
            CaseFile::class,
            $case->public_id
        );
    }
}
