<?php

namespace App\Domain\Documents\Actions;

use App\Domain\Auth\Actions\RecordAuditLogAction;
use App\Domain\Documents\Models\Document;
use Illuminate\Contracts\Auth\Authenticatable;

class DeleteDocumentAction
{
    public function __construct(private readonly RecordAuditLogAction $auditLog)
    {
    }

    public function handle(Document $document, ?Authenticatable $user): void
    {
        $document->delete();

        $this->auditLog->handle(
            'document.deleted',
            $user,
            Document::class,
            $document->public_id
        );
    }
}
