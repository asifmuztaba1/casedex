<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;

class StoreAiManualPaymentRequest extends FormRequest
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
            'pack_public_id' => ['required', 'string', 'max:64'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'sender_number' => ['required', 'string', 'max:32'],
            'transaction_id' => ['required', 'string', 'max:128'],
            'sent_at' => ['required', 'date'],
            'screenshot' => ['required', 'file', 'mimes:png,jpg,jpeg,webp', 'max:5120'],
        ];
    }
}
