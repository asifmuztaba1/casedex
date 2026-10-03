<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAiProviderRequest extends FormRequest
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
            'model' => ['required', 'string', 'max:120', 'regex:/^[A-Za-z0-9._:\/-]+$/'],
            // Leave out to keep the saved key.
            'api_key' => ['nullable', 'string', 'min:8', 'max:500'],
            'base_url' => ['nullable', 'url:https', 'max:255'],
        ];
    }
}
