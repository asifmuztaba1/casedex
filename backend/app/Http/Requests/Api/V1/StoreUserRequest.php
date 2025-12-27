<?php

namespace App\Http\Requests\Api\V1;

use App\Domain\Auth\Enums\UserRole;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class StoreUserRequest extends FormRequest
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
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', Password::min(8)],
            'role' => ['required', Rule::in(UserRole::tenantRoles())],
            'country_id' => ['required', 'integer', 'exists:countries,id'],
            'locale' => ['nullable', 'string', 'in:en,bn'],
        ];
    }
}
