<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;

class StoreTenantRequest extends FormRequest
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
            'tenant_name' => ['required', 'string', 'max:255'],
            'country_id' => ['required', 'integer', 'exists:countries,id'],
            'locale' => ['nullable', 'string', 'in:en,bn'],
        ];
    }
}
