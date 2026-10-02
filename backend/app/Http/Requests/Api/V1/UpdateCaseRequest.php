<?php

namespace App\Http\Requests\Api\V1;

use App\Domain\Cases\Enums\CaseStatus;
use App\Http\Requests\Api\V1\Concerns\ResolvesClientPublicId;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use App\Support\TenantContext;

class UpdateCaseRequest extends FormRequest
{
    use ResolvesClientPublicId;

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
            'court' => ['sometimes', 'required_without:court_public_id', 'string', 'max:200'],
            'court_public_id' => ['sometimes', 'nullable', 'string', 'exists:courts,public_id'],
            'case_number' => ['nullable', 'string', 'max:120'],
            'registry_case_type_bn' => ['nullable', 'string', 'max:120'],
            'registry_case_serial' => ['nullable', 'integer', 'min:1'],
            'registry_case_year' => ['nullable', 'integer', 'min:1900', 'max:2100'],
            'status' => ['nullable', Rule::in(array_column(CaseStatus::cases(), 'value'))],
            'story' => ['sometimes', 'nullable', 'string'],
            'petition_draft' => ['sometimes', 'nullable', 'string'],
            'opposite_lawyer_name' => ['sometimes', 'nullable', 'string', 'max:200'],
            'client_public_id' => ['nullable', 'string', $this->clientPublicIdExists()],
        ];
    }
}
