<?php

namespace App\Domain\Cases\Actions;

use App\Domain\Auth\Actions\RecordAuditLogAction;
use App\Domain\Cases\Models\CaseFile;
use Illuminate\Contracts\Auth\Authenticatable;

class UpdateCaseAction
{
    public function __construct(private readonly RecordAuditLogAction $auditLog)
    {
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function handle(CaseFile $case, array $data, ?Authenticatable $user): CaseFile
    {
        $case->fill($data);
        $case->save();

        $this->auditLog->handle(
            'case.updated',
            $user,
            CaseFile::class,
            $case->public_id
        );

        return $case;
    }
}
