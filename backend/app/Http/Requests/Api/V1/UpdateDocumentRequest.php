<?php

namespace App\Http\Requests\Api\V1;

use App\Domain\Documents\Enums\DocumentCategory;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateDocumentRequest extends FormRequest
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
        $tenant = $this->user()?->tenant;
        $isFree = $tenant?->plan?->value === 'free';
        $allowedMimes = $isFree ? ['pdf', 'jpg', 'jpeg', 'png'] : ['pdf', 'jpg', 'jpeg', 'png'];

        return [
            'case_public_id' => ['sometimes', 'required', 'string'],
            'hearing_public_id' => ['nullable', 'string'],
            'category' => ['sometimes', 'required', Rule::in(array_column(DocumentCategory::cases(), 'value'))],
            'file' => ['sometimes', 'file', 'mimes:'.implode(',', $allowedMimes)],
        ];
    }
}
