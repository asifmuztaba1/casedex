<?php

namespace App\Http\Requests\Api\V1;

use App\Domain\Cases\Enums\PartyRole;
use App\Domain\Cases\Enums\PartySide;
use App\Domain\Cases\Enums\PartyType;
use App\Http\Requests\Api\V1\Concerns\ResolvesClientPublicId;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use App\Support\TenantContext;

class UpdateCasePartyRequest extends FormRequest
{
    use ResolvesClientPublicId;

    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string', 'max:200'],
            'type' => ['sometimes', Rule::in(array_column(PartyType::cases(), 'value'))],
            'side' => ['sometimes', Rule::in(array_column(PartySide::cases(), 'value'))],
            'role' => ['sometimes', Rule::in(array_column(PartyRole::cases(), 'value'))],
            'is_client' => ['sometimes', 'boolean'],
            'client_public_id' => ['sometimes', 'string', $this->clientPublicIdExists()],
            'phone' => ['sometimes', 'nullable', 'string', 'max:50'],
            'email' => ['sometimes', 'nullable', 'email', 'max:200'],
            'address' => ['sometimes', 'nullable', 'string', 'max:255'],
            'identity_number' => ['sometimes', 'nullable', 'string', 'max:100'],
            'notes' => ['sometimes', 'nullable', 'string'],
        ];
    }
}
