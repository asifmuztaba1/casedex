<?php

namespace App\Http\Requests\Api\V1;

use App\Domain\Cases\Enums\CaseParticipantRole;
use App\Domain\Cases\Enums\CaseStatus;
use App\Domain\Cases\Enums\PartyRole;
use App\Domain\Cases\Enums\PartySide;
use App\Domain\Cases\Enums\PartyType;
use App\Domain\Hearings\Enums\HearingType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCaseRequest extends FormRequest
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
            'title' => ['required', 'string', 'max:200'],
            'court' => ['required_without:court_public_id', 'string', 'max:200'],
            'court_public_id' => ['nullable', 'string', 'exists:courts,public_id'],
            'case_number' => ['nullable', 'string', 'max:120'],
            'status' => ['nullable', Rule::in(array_column(CaseStatus::cases(), 'value'))],
            'story' => ['required', 'string'],
            'petition_draft' => ['required', 'string'],

            'client_id' => ['nullable', 'integer', 'exists:clients,id'],
            'client' => ['nullable', 'array'],
            'client.name' => ['required_without:client_id', 'string', 'max:200'],
            'client.phone' => ['nullable', 'string', 'max:50'],
            'client.email' => ['nullable', 'email', 'max:200'],
            'client.address' => ['nullable', 'string', 'max:255'],
            'client.identity_number' => ['nullable', 'string', 'max:100'],
            'client.notes' => ['nullable', 'string'],
            'client_party_role' => ['nullable', Rule::in(array_column(PartyRole::cases(), 'value'))],
            'client_party_type' => ['nullable', Rule::in(array_column(PartyType::cases(), 'value'))],

            'participants' => ['nullable', 'array'],
            'participants.*.user_public_id' => ['required_with:participants', 'string'],
            'participants.*.role' => [
                'required_with:participants',
                Rule::in(array_column(CaseParticipantRole::cases(), 'value')),
            ],

            'parties' => ['nullable', 'array'],
            'parties.*.name' => ['required_with:parties', 'string', 'max:200'],
            'parties.*.type' => [
                'required_with:parties',
                Rule::in(array_column(PartyType::cases(), 'value')),
            ],
            'parties.*.side' => [
                'required_with:parties',
                Rule::in(array_column(PartySide::cases(), 'value')),
            ],
            'parties.*.role' => [
                'nullable',
                Rule::in(array_column(PartyRole::cases(), 'value')),
            ],
            'parties.*.phone' => ['nullable', 'string', 'max:50'],
            'parties.*.email' => ['nullable', 'email', 'max:200'],
            'parties.*.address' => ['nullable', 'string', 'max:255'],
            'parties.*.identity_number' => ['nullable', 'string', 'max:100'],
            'parties.*.notes' => ['nullable', 'string'],

            'first_hearing' => ['nullable', 'array'],
            'first_hearing.hearing_at' => ['required_with:first_hearing', 'date'],
            'first_hearing.type' => [
                'required_with:first_hearing',
                Rule::in(array_column(HearingType::cases(), 'value')),
            ],
            'first_hearing.agenda' => ['nullable', 'string'],
            'first_hearing.location' => ['nullable', 'string', 'max:200'],
        ];
    }
}
