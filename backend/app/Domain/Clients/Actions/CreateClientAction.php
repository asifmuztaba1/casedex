<?php

namespace App\Domain\Clients\Actions;

use App\Domain\Auth\Actions\RecordAuditLogAction;
use App\Domain\Clients\Models\Client;
use Illuminate\Contracts\Auth\Authenticatable;

class CreateClientAction
{
    public function __construct(private readonly RecordAuditLogAction $auditLog)
    {
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function handle(array $data, ?Authenticatable $user): Client
    {
        $client = Client::create($data);

        $this->auditLog->handle(
            'client.created',
            $user,
            Client::class,
            (string) $client->id
        );

        return $client;
    }
}
