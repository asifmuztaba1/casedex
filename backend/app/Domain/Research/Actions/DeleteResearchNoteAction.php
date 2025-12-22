<?php

namespace App\Domain\Research\Actions;

use App\Domain\Auth\Actions\RecordAuditLogAction;
use App\Domain\Research\Models\ResearchNote;
use Illuminate\Contracts\Auth\Authenticatable;

class DeleteResearchNoteAction
{
    public function __construct(private readonly RecordAuditLogAction $auditLog)
    {
    }

    public function handle(ResearchNote $note, ?Authenticatable $user): void
    {
        $note->delete();

        $this->auditLog->handle(
            'research_note.deleted',
            $user,
            ResearchNote::class,
            $note->public_id
        );
    }
}
