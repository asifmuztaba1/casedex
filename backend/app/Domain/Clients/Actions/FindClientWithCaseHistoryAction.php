<?php

namespace App\Domain\Clients\Actions;

use App\Domain\Clients\Models\Client;

class FindClientWithCaseHistoryAction
{
    public function handle(string $publicId): Client
    {
        return Client::query()
            ->withCount('caseParties')
            ->where('public_id', $publicId)
            ->firstOrFail()
            ->load(['caseParties.case']);
    }
}
