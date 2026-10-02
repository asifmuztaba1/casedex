<?php

namespace App\Http\Requests\Api\V1;

use Carbon\CarbonImmutable;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class CalendarHearingsRequest extends FormRequest
{
    /** Enough for a month or quarter view; stops one request pulling every hearing ever. */
    public const MAX_RANGE_DAYS = 92;

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
            'from' => ['required', 'date_format:Y-m-d'],
            'to' => ['required', 'date_format:Y-m-d', 'after_or_equal:from'],
            'user_public_id' => ['nullable', 'string'],
        ];
    }

    /**
     * @return array<int, callable>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                if ($validator->errors()->isNotEmpty()) {
                    return;
                }

                $from = CarbonImmutable::createFromFormat('Y-m-d', (string) $this->input('from'));
                $to = CarbonImmutable::createFromFormat('Y-m-d', (string) $this->input('to'));

                if ($from->diffInDays($to) > self::MAX_RANGE_DAYS) {
                    $validator->errors()->add('to', __('messages.calendar_range_too_long', ['days' => self::MAX_RANGE_DAYS]));
                }
            },
        ];
    }
}
