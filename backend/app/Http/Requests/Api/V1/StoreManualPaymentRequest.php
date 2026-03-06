<?php

namespace App\Http\Requests\Api\V1;

use App\Domain\Tenancy\Enums\TenantPlan;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreManualPaymentRequest extends FormRequest
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
            'plan' => ['required', Rule::in([
                TenantPlan::Starter->value,
                TenantPlan::Professional->value,
                TenantPlan::Chambers->value,
            ])],
            'interval' => ['required', Rule::in(['monthly', 'yearly'])],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'sender_number' => ['required', 'string', 'max:32'],
            'transaction_id' => ['required', 'string', 'max:128'],
            'sent_at' => ['required', 'date'],
            'screenshot' => ['required', 'file', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ];
    }
}
