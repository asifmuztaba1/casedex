<?php

namespace App\Http\Requests\Api\V1;

use App\Domain\Courts\Models\CourtDistrict;
use App\Domain\Courts\Models\CourtDivision;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCourtDistrictRequest extends FormRequest
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
        $district = CourtDistrict::query()
            ->where('public_id', $this->route('publicId'))
            ->first();

        $divisionId = $district?->division_id;

        if ($this->filled('division_public_id')) {
            $divisionId = CourtDivision::query()
                ->where('public_id', $this->input('division_public_id'))
                ->value('id');
        }

        return [
            'division_public_id' => ['sometimes', 'string', Rule::exists('court_divisions', 'public_id')],
            'name' => [
                'required',
                'string',
                'max:200',
                Rule::unique('court_districts', 'name')
                    ->where('division_id', $divisionId)
                    ->ignore($district?->id),
            ],
            'name_bn' => [
                'required',
                'string',
                'max:200',
                Rule::unique('court_districts', 'name_bn')
                    ->where('division_id', $divisionId)
                    ->ignore($district?->id),
            ],
        ];
    }
}
