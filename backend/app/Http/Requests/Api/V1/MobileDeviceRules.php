<?php

namespace App\Http\Requests\Api\V1;

/** Fields every mobile sign-in sends to describe the device. */
final class MobileDeviceRules
{
    /**
     * @return array<string, mixed>
     */
    public static function rules(): array
    {
        return [
            // Shown in the device list, e.g. "Pixel 8" or "Rahim's iPhone".
            'device_name' => ['required', 'string', 'max:100'],
            'platform' => ['required', 'string', 'in:ios,android'],
        ];
    }
}
