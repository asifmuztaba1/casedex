<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;

class StorePushSubscriptionRequest extends FormRequest
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
            'endpoint' => ['required', 'url'],
            'p256dh_key' => ['required', 'string', 'max:500'],
            'auth_key' => ['required', 'string', 'max:500'],
            'content_encoding' => ['nullable', 'string', 'max:40'],
            'user_agent' => ['nullable', 'string', 'max:255'],
        ];
    }
}
