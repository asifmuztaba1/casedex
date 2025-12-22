<?php

namespace App\Domain\Diary\Actions;

use App\Domain\Auth\Actions\RecordAuditLogAction;
use App\Domain\Cases\Models\CaseFile;
use App\Domain\Diary\Models\DiaryEntry;
use App\Domain\Hearings\Models\Hearing;
use Illuminate\Contracts\Auth\Authenticatable;

class UpdateDiaryEntryAction
{
    public function __construct(private readonly RecordAuditLogAction $auditLog)
    {
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function handle(
        DiaryEntry $entry,
        array $data,
        ?string $casePublicId,
        ?string $hearingPublicId,
        ?Authenticatable $user
    ): DiaryEntry {
        $caseId = $entry->case_id;

        if ($casePublicId !== null) {
            $caseId = $this->resolveCaseId($casePublicId);
            $data['case_id'] = $caseId;
        }

        if ($hearingPublicId !== null) {
            $data['hearing_id'] = $this->resolveHearingId($hearingPublicId, $caseId);
        }

        $entry->fill($data);
        $entry->save();

        $this->auditLog->handle(
            'diary_entry.updated',
            $user,
            DiaryEntry::class,
            $entry->public_id
        );

        return $entry;
    }

    private function resolveCaseId(string $casePublicId): int
    {
        $caseId = CaseFile::query()
            ->where('public_id', $casePublicId)
            ->value('id');

        if ($caseId === null) {
            abort(422, 'Case not found for the provided public_id.');
        }

        return $caseId;
    }

    private function resolveHearingId(string $hearingPublicId, int $caseId): int
    {
        $hearingId = Hearing::query()
            ->where('public_id', $hearingPublicId)
            ->where('case_id', $caseId)
            ->value('id');

        if ($hearingId === null) {
            abort(422, 'Hearing not found for the provided public_id.');
        }

        return $hearingId;
    }
}
