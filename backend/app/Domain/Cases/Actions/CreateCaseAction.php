<?php

namespace App\Domain\Cases\Actions;

use App\Domain\Auth\Actions\RecordAuditLogAction;
use App\Domain\Cases\Enums\CaseStatus;
use App\Domain\Cases\Enums\PartyRole;
use App\Domain\Cases\Enums\PartySide;
use App\Domain\Cases\Enums\PartyType;
use App\Domain\Cases\Models\CaseFile;
use App\Domain\Cases\Models\CaseParty;
use App\Domain\Cases\Models\CaseParticipant;
use App\Domain\Cases\Enums\CaseParticipantRole;
use App\Domain\Clients\Models\Client;
use App\Domain\Courts\Models\Court;
use App\Domain\Hearings\Models\Hearing;
use App\Domain\Notifications\Actions\SendCasePartyAddedMailAction;
use App\Domain\Tenancy\Enums\TenantPlan;
use App\Domain\Tenancy\Models\Tenant;
use App\Models\User;
use App\Support\TenantContext;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Support\Facades\DB;

class CreateCaseAction
{
    public function __construct(
        private readonly RecordAuditLogAction $auditLog,
        private readonly SendCasePartyAddedMailAction $sendCasePartyAddedMail
    ) {
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function handle(array $data, ?Authenticatable $user): CaseFile
    {
        $tenantId = TenantContext::id();
        $tenant = Tenant::query()->findOrFail($tenantId);

        if ($tenant->plan === TenantPlan::Free) {
            $caseCount = CaseFile::query()
                ->where('tenant_id', $tenantId)
                ->count();

            if ($caseCount >= 5) {
                abort(403, __('messages.free_plan_case_limit'));
            }
        }

        return DB::transaction(function () use ($data, $user): CaseFile {
            $clientId = $data['client_id'] ?? null;

            if ($clientId !== null) {
                $clientId = Client::query()
                    ->where('id', $clientId)
                    ->where('tenant_id', TenantContext::id())
                    ->value('id');

                if ($clientId === null) {
                    abort(422, __('messages.client_not_found'));
                }
            }

            if ($clientId === null && isset($data['client'])) {
                $client = Client::create($data['client']);
                $clientId = $client->id;
            }

            $court = null;
            if (! empty($data['court_public_id'])) {
                $court = Court::query()
                    ->where('public_id', $data['court_public_id'])
                    ->first();
            }

            $courtName = $data['court'] ?? null;
            $courtId = null;

            if ($court !== null) {
                $courtId = $court->id;
                $courtName = $court->displayName(app()->getLocale());
            }

            $case = CaseFile::create([
                'title' => $data['title'],
                'court' => $courtName,
                'court_id' => $courtId,
                'case_number' => $data['case_number'] ?? null,
                'status' => $data['status'] ??  CaseStatus::Open,
                'story' => $data['story'],
                'petition_draft' => $data['petition_draft'],
                'client_id' => $clientId,
                'created_by' => $user?->id,
            ]);

            if ($clientId !== null) {
                $client = Client::query()
                    ->where('id', $clientId)
                    ->where('tenant_id', TenantContext::id())
                    ->first();

                if ($client) {
                    $clientParty = CaseParty::create([
                        'case_id' => $case->id,
                        'client_id' => $client->id,
                        'type' => $data['client_party_type'] ?? PartyType::Person->value,
                        'name' => $client->name,
                        'side' => PartySide::Client->value,
                        'role' => $data['client_party_role'] ?? PartyRole::Petitioner->value,
                        'is_client' => true,
                        'phone' => $client->phone,
                        'email' => $client->email,
                        'address' => $client->address,
                        'identity_number' => $client->identity_number,
                        'notes' => $client->notes,
                    ]);

                    $this->sendCasePartyAddedMail->handle(
                        $case,
                        $clientParty,
                        $user instanceof User ? $user : null
                    );
                }
            }

            $parties = $data['parties'] ?? [];
            foreach ($parties as $party) {
                $newParty = CaseParty::create([
                    'case_id' => $case->id,
                    'type' => $party['type'],
                    'name' => $party['name'],
                    'side' => $party['side'],
                    'role' => $party['role'] ?? null,
                    'is_client' => false,
                    'phone' => $party['phone'] ?? null,
                    'email' => $party['email'] ?? null,
                    'address' => $party['address'] ?? null,
                    'identity_number' => $party['identity_number'] ?? null,
                    'notes' => $party['notes'] ?? null,
                ]);

                $this->sendCasePartyAddedMail->handle(
                    $case,
                    $newParty,
                    $user instanceof User ? $user : null
                );
            }

            $participants = $data['participants'] ?? [];
            $participantUserIds = [];

            foreach ($participants as $participant) {
                $participantUser = User::query()
                    ->where('public_id', $participant['user_public_id'])
                    ->where('tenant_id', $case->tenant_id)
                    ->first();

                if ($participantUser === null) {
                    continue;
                }

                $participantUserIds[] = $participantUser->id;

                CaseParticipant::create([
                    'case_id' => $case->id,
                    'user_id' => $participantUser->id,
                    'role' => $participant['role'],
                ]);
            }

            if ($user !== null && ! in_array($user->id, $participantUserIds, true)) {
                CaseParticipant::create([
                    'case_id' => $case->id,
                    'user_id' => $user->id,
                    'role' => CaseParticipantRole::LeadLawyer->value,
                ]);
            }

            if (isset($data['first_hearing'])) {
                $firstHearing = $data['first_hearing'];

                Hearing::create([
                    'case_id' => $case->id,
                    'hearing_at' => $firstHearing['hearing_at'],
                    'type' => $firstHearing['type'],
                    'agenda' => $firstHearing['agenda'] ?? null,
                    'location' => $firstHearing['location'] ?? null,
                ]);
            }

            $this->auditLog->handle(
                'case.created',
                $user,
                CaseFile::class,
                $case->public_id
            );

            return $case;
        });
    }
}
