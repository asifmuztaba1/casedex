<?php

namespace App\Console\Commands;

use App\Domain\Voice\Models\VoiceSession;
use App\Jobs\FinalizeVoiceSessionJob;
use Illuminate\Console\Command;

/** Bills associate conversations whose browser never reported the end (tab closed). */
class FinalizeVoiceSessions extends Command
{
    protected $signature = 'voice:finalize-sessions';

    protected $description = 'Bill voice associate conversations that ended without the app reporting it';

    public function handle(): int
    {
        $cutoff = now()->subSeconds((int) config('services.elevenlabs.associate_max_seconds', 600) + 300);
        $count = 0;

        VoiceSession::query()->withoutGlobalScopes()
            ->whereIn('status', [VoiceSession::STARTED, VoiceSession::ENDED])
            ->where('started_at', '<=', $cutoff)
            ->each(function (VoiceSession $session) use (&$count): void {
                FinalizeVoiceSessionJob::dispatch($session->tenant_id, $session->id);
                $count++;
            });

        $this->info("Queued {$count} session(s) for billing.");

        return self::SUCCESS;
    }
}
