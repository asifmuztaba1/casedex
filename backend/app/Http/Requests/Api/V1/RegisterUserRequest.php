<?php

namespace App\Http\Requests\Api\V1;

use App\Domain\Platform\Services\RegistrationPolicy;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class RegisterUserRequest extends FormRequest
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
            'password' => ['required', 'confirmed', Password::min(8)],
            'country_id' => ['required', 'integer', 'exists:countries,id'],
            'locale' => ['nullable', 'string', 'in:en,bn'],
            // Private beta: required while registration is invite-only (Admin → Invites).
            'invite_code' => [Rule::requiredIf(fn (): bool => app(RegistrationPolicy::class)->requiresInvite()), 'nullable', 'string', 'max:40'],
        ];
    }
}
