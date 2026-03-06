<?php

namespace App\Http\Requests\Api\V1;

use App\Domain\Billing\Enums\ManualPaymentChannel;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateManualPaymentMethodRequest extends FormRequest
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
            'channel' => ['sometimes', Rule::in(array_column(ManualPaymentChannel::cases(), 'value'))],
            'account_name' => ['nullable', 'string', 'max:255'],
            'receiver_number' => ['sometimes', 'string', 'max:32'],
            'instructions_en' => ['nullable', 'string'],
            'instructions_bn' => ['nullable', 'string'],
            'active' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
        ];
    }
}
