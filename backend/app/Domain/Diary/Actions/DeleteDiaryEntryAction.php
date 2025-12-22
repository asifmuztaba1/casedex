<?php

namespace App\Domain\Diary\Actions;

use App\Domain\Auth\Actions\RecordAuditLogAction;
use App\Domain\Diary\Models\DiaryEntry;
use Illuminate\Contracts\Auth\Authenticatable;

class DeleteDiaryEntryAction
{
    public function __construct(private readonly RecordAuditLogAction $auditLog)
    {
    }

    public function handle(DiaryEntry $entry, ?Authenticatable $user): void
    {
        $entry->delete();

        $this->auditLog->handle(
            'diary_entry.deleted',
            $user,
            DiaryEntry::class,
            $entry->public_id
        );
    }
}
