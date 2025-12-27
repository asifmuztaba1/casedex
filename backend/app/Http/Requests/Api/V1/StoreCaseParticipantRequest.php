<?php

namespace App\Http\Requests\Api\V1;

use App\Domain\Cases\Enums\CaseParticipantRole;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCaseParticipantRequest extends FormRequest
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
            'user_public_id' => ['required', 'string'],
            'role' => ['required', Rule::in(array_column(CaseParticipantRole::cases(), 'value'))],
        ];
    }
}
