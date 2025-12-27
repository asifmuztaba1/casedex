<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCourtDivisionRequest extends FormRequest
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
            'country_id' => ['required', 'integer', 'exists:countries,id'],
            'name' => [
                'required',
                'string',
                'max:200',
                Rule::unique('court_divisions', 'name')
                    ->where('country_id', $this->input('country_id')),
            ],
            'name_bn' => [
                'required',
                'string',
                'max:200',
                Rule::unique('court_divisions', 'name_bn')
                    ->where('country_id', $this->input('country_id')),
            ],
        ];
    }
}
