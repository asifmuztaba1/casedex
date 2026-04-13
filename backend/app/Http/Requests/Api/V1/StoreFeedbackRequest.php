<?php

namespace App\Http\Requests\Api\V1;

use App\Domain\Feedback\Enums\FeedbackTrigger;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreFeedbackRequest extends FormRequest
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
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'comment' => ['nullable', 'string', 'max:2000'],
            'trigger' => ['required', Rule::in(array_column(FeedbackTrigger::cases(), 'value'))],
        ];
    }
}
