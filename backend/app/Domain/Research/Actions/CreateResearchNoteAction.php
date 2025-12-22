<?php

namespace App\Domain\Research\Actions;

use App\Domain\Auth\Actions\RecordAuditLogAction;
use App\Domain\Research\Models\ResearchNote;
use Illuminate\Contracts\Auth\Authenticatable;

class CreateResearchNoteAction
{
    public function __construct(private readonly RecordAuditLogAction $auditLog)
    {
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function handle(array $data, ?Authenticatable $user): ResearchNote
    {
        $note = ResearchNote::create($data);

        $this->auditLog->handle(
            'research_note.created',
            $user,
            ResearchNote::class,
            $note->public_id
        );

        return $note;
    }
}
