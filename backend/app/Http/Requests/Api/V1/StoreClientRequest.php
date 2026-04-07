<?php

namespace App\Http\Requests\Api\V1;

use App\Domain\Clients\Enums\ContactType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreClientRequest extends FormRequest
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
            'phone' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:200'],
            'address' => ['nullable', 'string', 'max:255'],
            'identity_number' => ['nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string'],
            'type' => ['nullable', Rule::in(array_column(ContactType::cases(), 'value'))],
            'is_client' => ['nullable', 'boolean'],
        ];
    }
}
