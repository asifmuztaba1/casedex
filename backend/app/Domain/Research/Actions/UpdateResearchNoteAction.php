<?php

namespace App\Domain\Research\Actions;

use App\Domain\Auth\Actions\RecordAuditLogAction;
use App\Domain\Research\Models\ResearchNote;
use Illuminate\Contracts\Auth\Authenticatable;

class UpdateResearchNoteAction
{
    public function __construct(private readonly RecordAuditLogAction $auditLog)
    {
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function handle(ResearchNote $note, array $data, ?Authenticatable $user): ResearchNote
    {
        $note->fill($data);
        $note->save();

        $this->auditLog->handle(
            'research_note.updated',
            $user,
            ResearchNote::class,
            $note->public_id
        );

        return $note;
    }
}
