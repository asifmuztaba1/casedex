<?php

namespace App\Domain\Cases\Actions;

use App\Domain\Cases\Models\CaseFile;

class FindCaseAction
{
    public function handle(string $publicId): CaseFile
    {
        return CaseFile::query()
            ->where('public_id', $publicId)
            ->firstOrFail();
    }
}
