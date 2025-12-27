<?php

namespace App\Domain\Cases\Actions;

use App\Domain\Auth\Actions\RecordAuditLogAction;
use App\Domain\Cases\Models\CaseParty;
use App\Domain\Cases\Models\CaseFile;
use App\Support\TenantContext;
use Illuminate\Contracts\Auth\Authenticatable;

class AddCasePartyAction
{
    public function __construct(private readonly RecordAuditLogAction $auditLog)
    {
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function handle(CaseFile $case, array $data, ?Authenticatable $user): CaseParty
    {
        $isClient = (bool) ($data['is_client'] ?? false);

        if ($isClient) {
            if ($case->client_id === null) {
                abort(422, __('messages.client_party_requires_client'));
            }

            $existingClientParty = CaseParty::query()
                ->where('case_id', $case->id)
                ->where('is_client', true)
                ->exists();

            if ($existingClientParty) {
                abort(422, __('messages.client_party_exists'));
            }

            if (isset($data['client_id']) && (int) $data['client_id'] !== (int) $case->client_id) {
                abort(422, __('messages.client_party_mismatch'));
            }
        }

        $party = CaseParty::create([
            'case_id' => $case->id,
            'client_id' => $data['client_id'] ?? null,
            'type' => $data['type'],
            'name' => $data['name'],
            'side' => $data['side'],
            'role' => $data['role'] ?? null,
            'is_client' => $isClient,
            'phone' => $data['phone'] ?? null,
            'email' => $data['email'] ?? null,
            'address' => $data['address'] ?? null,
            'identity_number' => $data['identity_number'] ?? null,
            'notes' => $data['notes'] ?? null,
            'tenant_id' => TenantContext::id(),
        ]);

        $this->auditLog->handle(
            'case.party.added',
            $user,
            CaseParty::class,
            (string) $party->id
        );

        return $party;
    }
}
