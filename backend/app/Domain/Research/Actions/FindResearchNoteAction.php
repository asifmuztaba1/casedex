<?php

namespace App\Domain\Research\Actions;

use App\Domain\Research\Models\ResearchNote;

class FindResearchNoteAction
{
    public function handle(string $publicId): ResearchNote
    {
        return ResearchNote::query()
            ->where('public_id', $publicId)
            ->firstOrFail();
    }
}
