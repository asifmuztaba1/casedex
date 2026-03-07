<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use App\Domain\Tenancy\Enums\TenantPlan;

class StoreManualSubscriptionChangeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'admin';
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'type' => ['required', Rule::in(['cancel', 'plan_change'])],
            'requested_plan' => [
                'required_if:type,plan_change',
                Rule::in([
                    TenantPlan::Starter->value,
                    TenantPlan::Professional->value,
                    TenantPlan::Chambers->value,
                ]),
            ],
            'requested_interval' => ['required_if:type,plan_change', Rule::in(['monthly', 'yearly'])],
            'effective_at' => ['required', 'date'],
        ];
    }
}
