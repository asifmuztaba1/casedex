<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCourtDistrictRequest extends FormRequest
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
            'division_public_id' => ['required', 'string', Rule::exists('court_divisions', 'public_id')],
            'name' => ['required', 'string', 'max:200'],
            'name_bn' => ['required', 'string', 'max:200'],
        ];
    }
}
