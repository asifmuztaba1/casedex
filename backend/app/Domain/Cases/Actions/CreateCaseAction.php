<?php

namespace App\Domain\Cases\Actions;

use App\Domain\Auth\Actions\RecordAuditLogAction;
use App\Domain\Cases\Models\CaseFile;
use App\Domain\Cases\Models\CaseParticipant;
use App\Domain\Cases\Enums\CaseParticipantRole;
use App\Domain\Clients\Models\Client;
use App\Domain\Hearings\Models\Hearing;
use App\Domain\Tenancy\Enums\TenantPlan;
use App\Domain\Tenancy\Models\Tenant;
use App\Models\User;
use App\Support\TenantContext;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Support\Facades\DB;

class CreateCaseAction
{
    public function __construct(private readonly RecordAuditLogAction $auditLog)
    {
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
                abort(403, 'Free plan allows up to 5 cases.');
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
                    abort(422, 'Client not found for the provided id.');
                }
            }

            if ($clientId === null && isset($data['client'])) {
                $client = Client::create($data['client']);
                $clientId = $client->id;
            }

            $case = CaseFile::create([
                'title' => $data['title'],
                'court' => $data['court'],
                'case_number' => $data['case_number'] ?? null,
                'status' => $data['status'] ?? null,
                'story' => $data['story'],
                'petition_draft' => $data['petition_draft'],
                'client_id' => $clientId,
                'created_by' => $user?->id,
            ]);

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
