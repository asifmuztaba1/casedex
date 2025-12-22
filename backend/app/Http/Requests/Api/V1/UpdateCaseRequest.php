<?php

namespace App\Http\Requests\Api\V1;

use App\Domain\Cases\Enums\CaseStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCaseRequest extends FormRequest
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
            'title' => ['sometimes', 'required', 'string', 'max:200'],
            'court' => ['sometimes', 'required', 'string', 'max:200'],
            'case_number' => ['nullable', 'string', 'max:120'],
            'status' => ['nullable', Rule::in(array_column(CaseStatus::cases(), 'value'))],
            'story' => ['sometimes', 'required', 'string'],
            'petition_draft' => ['sometimes', 'required', 'string'],
            'client_id' => ['nullable', 'integer', 'exists:clients,id'],
        ];
    }
}
