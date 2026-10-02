<?php

namespace App\Http\Requests\Api\V1\Concerns;

use App\Domain\Clients\Models\Client;
use App\Support\TenantContext;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Exists;

/**
 * The API takes a contact's public_id; actions work with the internal
 * client_id. validated() swaps one for the other.
 */
trait ResolvesClientPublicId
{
    protected function clientPublicIdExists(): Exists
    {
        return Rule::exists('clients', 'public_id')
            ->where('tenant_id', TenantContext::id())
            ->whereNull('deleted_at');
    }

    public function validated($key = null, $default = null)
    {
        $data = parent::validated();

        if (array_key_exists('client_public_id', $data)) {
            $publicId = $data['client_public_id'];
            unset($data['client_public_id']);
            $data['client_id'] = $publicId === null
                ? null
                : Client::query()->where('public_id', $publicId)->value('id');
        }

        return data_get($data, $key, $default);
    }
}
