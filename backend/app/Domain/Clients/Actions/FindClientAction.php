<?php

namespace App\Domain\Clients\Actions;

use App\Domain\Clients\Models\Client;

class FindClientAction
{
    public function handle(int $id): Client
    {
        return Client::query()->findOrFail($id);
    }
}
