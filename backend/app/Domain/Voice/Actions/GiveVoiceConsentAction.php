<?php

namespace App\Domain\Voice\Actions;

use App\Domain\Auth\Actions\RecordAuditLogAction;
use App\Models\User;

/** The person agrees that their recordings are processed by ElevenLabs. */
class GiveVoiceConsentAction
{
    public function __construct(private readonly RecordAuditLogAction $auditLog)
    {
    }

    public function handle(User $user): void
    {
        if ($user->voice_consent_at !== null) {
            return;
        }

        $user->forceFill(['voice_consent_at' => now()])->save();
        $this->auditLog->handle('voice.consent_given', $user, User::class, $user->public_id, ['processor' => 'elevenlabs']);
    }
}
