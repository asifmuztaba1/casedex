<?php

namespace App\Http\Requests\Api\V1;

use App\Domain\Auth\Enums\UserRole;
use Illuminate\Foundation\Http\FormRequest;

class UpdateTenantRequest extends FormRequest
{
    public function authorize(): bool
    {
        // role is cast to the UserRole enum; comparing to the string 'admin' was always false.
        return $this->user()?->role === UserRole::Admin;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
        ];
    }
}
