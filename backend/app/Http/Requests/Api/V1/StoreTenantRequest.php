<?php

namespace App\Http\Requests\Api\V1;

use App\Domain\Tenancy\Enums\TenantPlan;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

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
            'plan' => [
                'required',
                'string',
                Rule::in([
                    TenantPlan::Starter->value,
                    TenantPlan::Professional->value,
                    TenantPlan::Chambers->value,
                ]),
            ],
        ];
    }
}
