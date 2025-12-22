<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;

class StoreDiaryEntryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $routeCase = $this->route('casePublicId');

        if ($routeCase) {
            $this->merge(['case_public_id' => $routeCase]);
        }
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'case_public_id' => ['required', 'string'],
            'hearing_public_id' => ['nullable', 'string'],
            'entry_at' => ['required', 'date'],
            'title' => ['required', 'string', 'max:200'],
            'body' => ['required', 'string'],
        ];
    }
}
