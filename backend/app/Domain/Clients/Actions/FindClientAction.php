<?php

namespace App\Domain\Clients\Actions;

use App\Domain\Clients\Models\Client;

class FindClientAction
{
    public function handle(string $publicId): Client
    {
        return Client::query()->where('public_id', $publicId)->firstOrFail();
    }
}
