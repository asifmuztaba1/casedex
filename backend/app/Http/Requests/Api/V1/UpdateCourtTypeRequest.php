<?php

namespace App\Http\Requests\Api\V1;

use App\Domain\Courts\Models\CourtType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCourtTypeRequest extends FormRequest
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
        $type = CourtType::query()
            ->where('public_id', $this->route('publicId'))
            ->first();

        $countryId = $type?->country_id;

        return [
            'name' => [
                'required',
                'string',
                'max:200',
                Rule::unique('court_types', 'name')
                    ->where('country_id', $countryId)
                    ->ignore($type?->id),
            ],
            'name_bn' => [
                'required',
                'string',
                'max:200',
                Rule::unique('court_types', 'name_bn')
                    ->where('country_id', $countryId)
                    ->ignore($type?->id),
            ],
        ];
    }
}
