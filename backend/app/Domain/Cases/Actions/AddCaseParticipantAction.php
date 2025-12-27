<?php

namespace App\Domain\Cases\Actions;

use App\Domain\Auth\Actions\RecordAuditLogAction;
use App\Domain\Cases\Models\CaseParticipant;
use App\Models\User;
use Illuminate\Contracts\Auth\Authenticatable;

class AddCaseParticipantAction
{
    public function __construct(private readonly RecordAuditLogAction $auditLog)
    {
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function handle(int $caseId, array $data, ?Authenticatable $user): CaseParticipant
    {
        $participantUser = User::query()
            ->where('public_id', $data['user_public_id'])
            ->where('tenant_id', $user?->tenant_id)
            ->firstOrFail();

        $participant = CaseParticipant::query()
            ->firstOrCreate(
                [
                    'case_id' => $caseId,
                    'user_id' => $participantUser->id,
                ],
                [
                    'role' => $data['role'],
                ]
            );

        if ($participant->role?->value !== $data['role']) {
            $participant->role = $data['role'];
            $participant->save();
        }

        $this->auditLog->handle(
            'case.participant.added',
            $user,
            CaseParticipant::class,
            (string) $participant->id
        );

        return $participant;
    }
}
