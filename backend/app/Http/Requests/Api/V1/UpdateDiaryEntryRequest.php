<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;

class UpdateDiaryEntryRequest extends FormRequest
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
            'case_public_id' => ['sometimes', 'required', 'string'],
            'hearing_public_id' => ['nullable', 'string'],
            'entry_at' => ['sometimes', 'required', 'date'],
            'title' => ['sometimes', 'required', 'string', 'max:200'],
            'body' => ['sometimes', 'required', 'string'],
        ];
    }
}
