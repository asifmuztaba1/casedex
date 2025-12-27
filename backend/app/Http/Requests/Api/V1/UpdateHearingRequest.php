<?php

namespace App\Http\Requests\Api\V1;

use App\Domain\Hearings\Enums\HearingType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateHearingRequest extends FormRequest
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
            'hearing_at' => ['sometimes', 'required', 'date'],
            'type' => ['sometimes', 'required', Rule::in(array_column(HearingType::cases(), 'value'))],
            'agenda' => ['nullable', 'string'],
            'location' => ['nullable', 'string', 'max:200'],
            'outcome' => ['nullable', 'string'],
            'minutes' => ['nullable', 'string'],
            'next_steps' => ['nullable', 'string'],
        ];
    }
}
