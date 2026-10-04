<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;

class UpdateVoiceSettingsRequest extends FormRequest
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
            'enabled' => ['required', 'boolean'],
            'zero_retention' => ['required', 'boolean'],
            // Leave out to keep the saved key.
            'api_key' => ['nullable', 'string', 'min:16', 'max:200'],
        ];
    }
}
