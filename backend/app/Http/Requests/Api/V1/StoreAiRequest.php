<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;

class StoreAiRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'idempotency_key' => ['required', 'string', 'max:120'],
            'content' => ['sometimes', 'string', 'max:20000'],
            'question' => ['sometimes', 'string', 'max:5000'],
            'context' => ['sometimes', 'string', 'max:50000'],
            'case_type' => ['sometimes', 'string', 'max:100'],
            'court_name' => ['sometimes', 'string', 'max:200'],
            'facts' => ['sometimes', 'string', 'max:20000'],
            'relief_sought' => ['sometimes', 'string', 'max:5000'],
            'sections' => ['sometimes', 'string', 'max:2000'],
            'client_name' => ['sometimes', 'string', 'max:200'],
            'opponent_name' => ['sometimes', 'string', 'max:200'],
            'case_title' => ['sometimes', 'string', 'max:200'],
            'case_status' => ['sometimes', 'string', 'max:100'],
            'language' => ['sometimes', 'string', 'in:en,bn,mixed'],
            'tone' => ['sometimes', 'string', 'in:formal,simple'],
        ];
    }
}
