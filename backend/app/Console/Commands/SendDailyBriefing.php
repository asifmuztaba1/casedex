<?php

namespace App\Console\Commands;

use App\Domain\Notifications\Actions\BuildDailyBriefingAction;
use App\Domain\Notifications\Models\CaseNotification;
use App\Jobs\SendDailyBriefingWhatsAppJob;
use App\Models\User;
use App\Support\TenantContext;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;

class SendDailyBriefing extends Command
{
    protected $signature = 'app:send-daily-briefing {--user-id= : Run for a single user (by DB id) for testing}';

    protected $description = 'Send the morning daily briefing to each active user (in-app + WhatsApp).';

    public function handle(BuildDailyBriefingAction $builder): int
    {
        $today = Carbon::now()->startOfDay();

        $query = User::query()->whereNotNull('tenant_id');

        if ($userId = $this->option('user-id')) {
            $query->where('id', $userId);
        }

        $sent = 0;
        $skipped = 0;

        $query->chunkById(100, function ($users) use ($builder, $today, &$sent, &$skipped): void {
            foreach ($users as $user) {
                TenantContext::set($user->tenant_id);
                try {
                    $briefing = $builder->handle($user, $today);

                    if (! $briefing['has_any']) {
                        $skipped++;
                        continue;
                    }

                    [$title, $body] = $this->formatMessage($user, $briefing);

                    // In-app notification (idempotent per user per day).
                    // The bell UI reads directly from case_notifications — no job needed;
                    // we mark status=sent so it shows up immediately.
                    $notification = CaseNotification::query()->firstOrCreate(
                        [
                            'tenant_id' => $user->tenant_id,
                            'user_id' => $user->id,
                            'notification_type' => 'daily_briefing',
                            'channel' => 'in_app',
                            'scheduled_for' => $today,
                        ],
                        [
                            'title' => $title,
                            'body' => $body,
                            'status' => 'sent',
                            'sent_at' => now(),
                        ]
                    );

                    if ($notification->wasRecentlyCreated) {
                        $sent++;
                    }

                    // WhatsApp notification (opt-in gated)
                    if ($user->whatsapp_opted_in && $user->whatsapp_phone) {
                        $wa = CaseNotification::query()->firstOrCreate(
                            [
                                'tenant_id' => $user->tenant_id,
                                'user_id' => $user->id,
                                'notification_type' => 'daily_briefing',
                                'channel' => 'whatsapp',
                                'scheduled_for' => $today,
                            ],
                            [
                                'title' => $title,
                                'body' => $body,
                                'status' => 'pending',
                            ]
                        );

                        if ($wa->wasRecentlyCreated) {
                            SendDailyBriefingWhatsAppJob::dispatch(
                                $user->tenant_id,
                                $wa->id,
                                $briefing
                            );
                        }
                    }
                } catch (\Throwable $e) {
                    Log::error('daily_briefing.user_failed', [
                        'user_id' => $user->id,
                        'tenant_id' => $user->tenant_id,
                        'error' => $e->getMessage(),
                    ]);
                } finally {
                    TenantContext::clear();
                }
            }
        });

        Log::info('daily_briefing.run_complete', [
            'sent' => $sent,
            'skipped' => $skipped,
            'date' => $today->toDateString(),
        ]);

        $this->info("Daily briefing: sent={$sent} skipped={$skipped}");

        return Command::SUCCESS;
    }

    /**
     * @param  array<string, mixed>  $briefing
     * @return array{0: string, 1: string}
     */
    private function formatMessage(User $user, array $briefing): array
    {
        $locale = $user->locale ?? 'en';
        $isBn = $locale === 'bn';

        $lines = [];

        $hearings = (int) $briefing['hearings_today'];
        if ($hearings > 0) {
            $firstPart = '';
            if ($briefing['first_hearing']) {
                $fh = $briefing['first_hearing'];
                $time = $fh['at'] instanceof Carbon
                    ? $fh['at']->format('g:i A')
                    : Carbon::parse($fh['at'])->format('g:i A');
                $title = $fh['case_title'] ?? ($isBn ? 'মামলা' : 'case');
                $court = $fh['court'] ? ' @ '.$fh['court'] : '';
                $firstPart = $isBn
                    ? " প্রথম: {$time} — {$title}{$court}।"
                    : " First: {$time} — {$title}{$court}.";
            }
            $lines[] = $isBn
                ? "আজ আপনার {$hearings}টি শুনানি আছে।{$firstPart}"
                : "You have {$hearings} hearing".($hearings === 1 ? '' : 's')." today.{$firstPart}";
        }

        $pending = (int) $briefing['pending_outcomes_yesterday'];
        if ($pending > 0) {
            $lines[] = $isBn
                ? "গতকালের {$pending}টি শুনানির ফলাফল রেকর্ড করা হয়নি।"
                : "{$pending} hearing".($pending === 1 ? '' : 's')." from yesterday ".($pending === 1 ? 'has' : 'have')." no recorded outcome.";
        }

        $causeList = (int) $briefing['cause_list_matches_today'];
        if ($causeList > 0) {
            $lines[] = $isBn
                ? "আজকের কজলিস্টে {$causeList}টি কেস আছে।"
                : "{$causeList} case".($causeList === 1 ? '' : 's')." on today's cause list.";
        }

        $deadlines = (int) $briefing['document_deadlines_today'];
        if ($deadlines > 0) {
            $lines[] = $isBn
                ? "{$deadlines}টি ডকুমেন্ট ডেডলাইন আজ।"
                : "{$deadlines} document deadline".($deadlines === 1 ? '' : 's')." today.";
        }

        $title = $isBn ? 'আজকের ব্রিফিং' : "Today's briefing";
        $body = implode(' ', $lines);

        return [$title, $body];
    }
}
