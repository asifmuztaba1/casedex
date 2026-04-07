<?php

namespace App\Domain\Clients\Actions;

use App\Domain\Clients\Models\Client;

class FindClientWithCaseHistoryAction
{
    public function handle(int $id): Client
    {
        return Client::query()
            ->withCount('caseParties')
            ->findOrFail($id)
            ->load(['caseParties.case']);
    }
}
