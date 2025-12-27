<?php

namespace App\Http\Requests\Api\V1;

use App\Domain\Courts\Models\CourtDivision;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCourtDivisionRequest extends FormRequest
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
        $division = CourtDivision::query()
            ->where('public_id', $this->route('publicId'))
            ->first();

        $divisionId = $division?->id;
        $countryId = $division?->country_id;

        return [
            'name' => [
                'required',
                'string',
                'max:200',
                Rule::unique('court_divisions', 'name')
                    ->where('country_id', $countryId)
                    ->ignore($divisionId),
            ],
            'name_bn' => [
                'required',
                'string',
                'max:200',
                Rule::unique('court_divisions', 'name_bn')
                    ->where('country_id', $countryId)
                    ->ignore($divisionId),
            ],
        ];
    }
}
