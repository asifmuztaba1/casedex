<?php

namespace App\Domain\Clients\Actions;

use App\Domain\Auth\Actions\RecordAuditLogAction;
use App\Domain\Clients\Models\Client;
use Illuminate\Contracts\Auth\Authenticatable;

class DeleteClientAction
{
    public function __construct(private readonly RecordAuditLogAction $auditLog)
    {
    }

    public function handle(Client $client, ?Authenticatable $user): void
    {
        $client->delete();

        $this->auditLog->handle(
            'client.deleted',
            $user,
            Client::class,
            (string) $client->id
        );
    }
}
