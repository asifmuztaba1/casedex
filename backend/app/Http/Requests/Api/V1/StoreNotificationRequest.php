<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;

class StoreNotificationRequest extends FormRequest
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
            'case_public_id' => ['nullable', 'string'],
            'hearing_public_id' => ['nullable', 'string'],
            'user_public_id' => ['nullable', 'string'],
            'notification_type' => ['nullable', 'string', 'max:80'],
            'channel' => ['nullable', 'string', 'max:40'],
            'title' => ['required', 'string', 'max:200'],
            'body' => ['nullable', 'string'],
            'scheduled_for' => ['nullable', 'date'],
        ];
    }
}
