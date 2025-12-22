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

class CreateDocumentAction
{
    public function __construct(private readonly RecordAuditLogAction $auditLog)
    {
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function handle(
        array $data,
        string $casePublicId,
        ?string $hearingPublicId,
        UploadedFile $file,
        ?Authenticatable $user
    ): Document {
        $case = CaseFile::query()
            ->where('public_id', $casePublicId)
            ->firstOrFail();

        $hearingId = null;

        if ($hearingPublicId !== null) {
            $hearingId = Hearing::query()
                ->where('public_id', $hearingPublicId)
                ->where('case_id', $case->id)
                ->value('id');

            if ($hearingId === null) {
                abort(422, 'Hearing not found for the provided public_id.');
            }
        }

        $extension = $file->getClientOriginalExtension();
        $filename = (string) Str::ulid().($extension ? '.'.$extension : '');
        $storageKey = sprintf(
            'tenants/%s/cases/%s/documents/%s',
            $case->tenant_id,
            $case->public_id,
            $filename
        );

        $directory = dirname($storageKey);

        Storage::disk(config('filesystems.default'))
            ->putFileAs($directory, $file, $filename);

        $document = Document::create([
            'case_id' => $case->id,
            'hearing_id' => $hearingId,
            'category' => $data['category'],
            'original_name' => $file->getClientOriginalName(),
            'mime' => $file->getClientMimeType(),
            'size' => $file->getSize(),
            'storage_key' => $storageKey,
            'uploaded_by' => $user?->id,
        ]);

        $this->auditLog->handle(
            'document.created',
            $user,
            Document::class,
            $document->public_id
        );

        return $document;
    }
}
