<?php

namespace App\Http\Requests\Api\V1;

use App\Domain\Cases\Enums\PartyRole;
use App\Domain\Cases\Enums\PartySide;
use App\Domain\Cases\Enums\PartyType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCasePartyRequest extends FormRequest
{
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
            'name' => ['required', 'string', 'max:200'],
            'type' => ['required', Rule::in(array_column(PartyType::cases(), 'value'))],
            'side' => ['required', Rule::in(array_column(PartySide::cases(), 'value'))],
            'role' => ['nullable', Rule::in(array_column(PartyRole::cases(), 'value'))],
            'is_client' => ['nullable', 'boolean'],
            'client_id' => ['nullable', 'integer', 'exists:clients,id'],
            'phone' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:200'],
            'address' => ['nullable', 'string', 'max:255'],
            'identity_number' => ['nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string'],
        ];
    }
}
