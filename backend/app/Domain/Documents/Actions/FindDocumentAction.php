<?php

namespace App\Domain\Documents\Actions;

use App\Domain\Documents\Models\Document;

class FindDocumentAction
{
    public function handle(string $publicId): Document
    {
        return Document::query()
            ->where('public_id', $publicId)
            ->firstOrFail();
    }
}
