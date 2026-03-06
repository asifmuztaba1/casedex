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
        ];
    }
}
