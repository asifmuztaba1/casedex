<?php

namespace App\Domain\Clients\Actions;

use App\Domain\Auth\Actions\RecordAuditLogAction;
use App\Domain\Clients\Models\Client;
use Illuminate\Contracts\Auth\Authenticatable;

class UpdateClientAction
{
    public function __construct(private readonly RecordAuditLogAction $auditLog)
    {
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function handle(Client $client, array $data, ?Authenticatable $user): Client
    {
        $client->fill($data);
        $client->save();

        $this->auditLog->handle(
            'client.updated',
            $user,
            Client::class,
            (string) $client->id
        );

        return $client;
    }
}
