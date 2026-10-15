<?php

namespace App\Http\Requests\Api\V1;

use App\Domain\Documents\Enums\DocumentCategory;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreDocumentRequest extends FormRequest
{
    /** Judged from the file's content, so a renamed file is caught too. */
    public const ALLOWED_TYPES = 'pdf,jpg,jpeg,png';

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
            'category' => ['required', Rule::in(array_column(DocumentCategory::cases(), 'value'))],
            'original_name' => ['nullable', 'string', 'max:255'],
            'due_at' => ['nullable', 'date'],
            'file' => ['required', 'file', 'mimes:'.self::ALLOWED_TYPES],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'file.mimes' => __('messages.document_file_type'),
        ];
    }
}
