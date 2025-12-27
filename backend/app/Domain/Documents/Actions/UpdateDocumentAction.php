<?php

namespace App\Domain\Documents\Actions;

use App\Domain\Auth\Actions\RecordAuditLogAction;
use App\Domain\Cases\Models\CaseFile;
use App\Domain\Documents\Models\Document;
use App\Domain\Hearings\Models\Hearing;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class UpdateDocumentAction
{
    public function __construct(private readonly RecordAuditLogAction $auditLog)
    {
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function handle(
        Document $document,
        array $data,
        ?string $casePublicId,
        ?string $hearingPublicId,
        ?UploadedFile $file,
        ?Authenticatable $user
    ): Document {
        $caseId = $document->case_id;
        $casePublic = null;

        if ($casePublicId !== null) {
            $case = CaseFile::query()
                ->where('public_id', $casePublicId)
                ->firstOrFail();

            $caseId = $case->id;
            $casePublic = $case->public_id;
            $data['case_id'] = $caseId;
        }

        if ($hearingPublicId !== null) {
            $hearingId = Hearing::query()
                ->where('public_id', $hearingPublicId)
                ->where('case_id', $caseId)
                ->value('id');

            if ($hearingId === null) {
                abort(422, __('messages.hearing_not_found_public_id'));
            }

            $data['hearing_id'] = $hearingId;
        }

        if ($file !== null) {
            $extension = $file->getClientOriginalExtension();
            $filename = (string) Str::ulid().($extension ? '.'.$extension : '');
            $storageKey = sprintf(
                'tenants/%s/cases/%s/documents/%s',
                $document->tenant_id,
                $casePublic ?? $document->case?->public_id ?? 'case',
                $filename
            );

            $directory = dirname($storageKey);

            Storage::disk(config('filesystems.default'))
                ->putFileAs($directory, $file, $filename);

            $data['original_name'] = $file->getClientOriginalName();
            $data['mime'] = $file->getClientMimeType();
            $data['size'] = $file->getSize();
            $data['storage_key'] = $storageKey;
        }

        $document->fill($data);
        $document->save();

        $this->auditLog->handle(
            'document.updated',
            $user,
            Document::class,
            $document->public_id
        );

        return $document;
    }
}
