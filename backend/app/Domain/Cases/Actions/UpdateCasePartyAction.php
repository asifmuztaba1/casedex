<?php

namespace App\Domain\Cases\Actions;

use App\Domain\Auth\Actions\RecordAuditLogAction;
use App\Domain\Cases\Models\CaseParty;
use Illuminate\Contracts\Auth\Authenticatable;

class UpdateCasePartyAction
{
    public function __construct(private readonly RecordAuditLogAction $auditLog)
    {
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function handle(CaseParty $party, array $data, ?Authenticatable $user): CaseParty
    {
        $isClient = $data['is_client'] ?? $party->is_client;

        if ($isClient) {
            $case = $party->case;
            if ($case?->client_id === null) {
                abort(422, __('messages.client_party_requires_client'));
            }

            $existingClientParty = CaseParty::query()
                ->where('case_id', $party->case_id)
                ->where('is_client', true)
                ->where('id', '!=', $party->id)
                ->exists();

            if ($existingClientParty) {
                abort(422, __('messages.client_party_exists'));
            }

            if (isset($data['client_id']) && (int) $data['client_id'] !== (int) $case->client_id) {
                abort(422, __('messages.client_party_mismatch'));
            }
        }

        $party->fill($data);
        $party->is_client = (bool) $isClient;
        $party->save();

        $this->auditLog->handle(
            'case.party.updated',
            $user,
            CaseParty::class,
            (string) $party->id
        );

        return $party;
    }
}
