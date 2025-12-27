<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCourtRequest extends FormRequest
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
            'district_public_id' => ['required', 'string', Rule::exists('court_districts', 'public_id')],
            'court_type_public_id' => ['required', 'string', Rule::exists('court_types', 'public_id')],
            'name' => ['required', 'string', 'max:200'],
            'name_bn' => ['required', 'string', 'max:200'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }
}
