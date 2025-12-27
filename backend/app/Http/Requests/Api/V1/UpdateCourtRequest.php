<?php

namespace App\Http\Requests\Api\V1;

use App\Domain\Courts\Models\Court;
use App\Domain\Courts\Models\CourtDistrict;
use App\Domain\Courts\Models\CourtType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCourtRequest extends FormRequest
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
        $court = Court::query()
            ->where('public_id', $this->route('publicId'))
            ->first();

        $districtId = $court?->district_id;
        $typeId = $court?->court_type_id;

        if ($this->filled('district_public_id')) {
            $districtId = CourtDistrict::query()
                ->where('public_id', $this->input('district_public_id'))
                ->value('id');
        }

        if ($this->filled('court_type_public_id')) {
            $typeId = CourtType::query()
                ->where('public_id', $this->input('court_type_public_id'))
                ->value('id');
        }

        return [
            'district_public_id' => ['sometimes', 'string', Rule::exists('court_districts', 'public_id')],
            'court_type_public_id' => ['sometimes', 'string', Rule::exists('court_types', 'public_id')],
            'name' => [
                'required',
                'string',
                'max:200',
                Rule::unique('courts', 'name')
                    ->where('district_id', $districtId)
                    ->where('court_type_id', $typeId)
                    ->ignore($court?->id),
            ],
            'name_bn' => [
                'required',
                'string',
                'max:200',
                Rule::unique('courts', 'name_bn')
                    ->where('district_id', $districtId)
                    ->where('court_type_id', $typeId)
                    ->ignore($court?->id),
            ],
            'is_active' => ['nullable', 'boolean'],
        ];
    }
}
