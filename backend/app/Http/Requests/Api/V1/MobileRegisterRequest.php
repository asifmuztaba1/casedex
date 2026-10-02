<?php

namespace App\Http\Requests\Api\V1;

class MobileRegisterRequest extends RegisterUserRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [...parent::rules(), ...MobileDeviceRules::rules()];
    }
}
