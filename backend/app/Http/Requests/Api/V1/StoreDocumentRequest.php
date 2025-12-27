<?php

namespace App\Http\Requests\Api\V1;

use App\Domain\Documents\Enums\DocumentCategory;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreDocumentRequest extends FormRequest
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
        $tenant = $this->user()?->tenant;
        $isFree = $tenant?->plan?->value === 'free';
        $allowedMimes = $isFree ? ['pdf', 'jpg', 'jpeg', 'png'] : ['pdf', 'jpg', 'jpeg', 'png'];

        return [
            'case_public_id' => ['required', 'string'],
            'hearing_public_id' => ['nullable', 'string'],
            'category' => ['required', Rule::in(array_column(DocumentCategory::cases(), 'value'))],
            'original_name' => ['nullable', 'string', 'max:255'],
            'file' => ['required', 'file', 'mimes:'.implode(',', $allowedMimes)],
        ];
    }
}
