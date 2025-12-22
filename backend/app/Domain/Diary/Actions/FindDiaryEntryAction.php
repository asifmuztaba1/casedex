<?php

namespace App\Domain\Diary\Actions;

use App\Domain\Diary\Models\DiaryEntry;

class FindDiaryEntryAction
{
    public function handle(string $publicId): DiaryEntry
    {
        return DiaryEntry::query()
            ->where('public_id', $publicId)
            ->firstOrFail();
    }
}
