<?php

namespace App\Console\Commands;

use App\Domain\Auth\Enums\UserRole;
use App\Domain\Cases\Models\CaseParticipant;
use App\Domain\Hearings\Models\Hearing;
use App\Domain\Notifications\Models\CaseNotification;
use App\Jobs\SendHearingReminderJob;
use App\Jobs\SendWhatsAppNotificationJob;
use App\Models\User;
use App\Support\TenantContext;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;

class SendHearingReminders extends Command
{
    protected $signature = 'hearings:send-reminders';

    protected $description = 'Send daily hearing reminders to case participants.';

    public function handle(): int
    {
        $tomorrowStart = Carbon::now()->addDay()->startOfDay();
        $tomorrowEnd = Carbon::now()->addDay()->endOfDay();

        $hearings = Hearing::query()
            ->whereBetween('hearing_at', [$tomorrowStart, $tomorrowEnd])
            ->get();

        foreach ($hearings as $hearing) {
            TenantContext::set($hearing->tenant_id);

            try {
                $participants = CaseParticipant::query()
                    ->where('case_id', $hearing->case_id)
                    ->with('user')
                    ->get();

                $participantUserIds = $participants->pluck('user_id')->all();

                $admins = User::query()
                    ->where('tenant_id', $hearing->tenant_id)
                    ->where('role', UserRole::Admin)
                    ->get();

                foreach ($admins as $admin) {
                    if (! in_array($admin->id, $participantUserIds, true)) {
                        $participants->push(new CaseParticipant([
                            'user_id' => $admin->id,
                            'case_id' => $hearing->case_id,
                        ]));
                    }
                }

                foreach ($participants as $participant) {
                    if ($participant->user === null) {
                        continue;
                    }

                    $notification = CaseNotification::query()
                        ->firstOrCreate(
                            [
                                'tenant_id' => $hearing->tenant_id,
                                'case_id' => $hearing->case_id,
                                'user_id' => $participant->user_id,
                                'hearing_id' => $hearing->id,
                                'notification_type' => 'hearing_reminder',
                                'scheduled_for' => $tomorrowStart,
                            ],
                            [
                                'title' => 'Hearing reminder',
                                'body' => 'Reminder: hearing scheduled for tomorrow.',
                                'status' => 'pending',
                                'channel' => 'in_app',
                            ]
                        );

                    if ($notification->wasRecentlyCreated) {
                        SendHearingReminderJob::dispatch(
                            $hearing->tenant_id,
                            $notification->id
                        );
                    }

                    if ($participant->user->whatsapp_opted_in && $participant->user->whatsapp_phone) {
                        $waNotification = CaseNotification::query()
                            ->firstOrCreate(
                                [
                                    'tenant_id' => $hearing->tenant_id,
                                    'case_id' => $hearing->case_id,
                                    'user_id' => $participant->user_id,
                                    'hearing_id' => $hearing->id,
                                    'notification_type' => 'hearing_reminder',
                                    'channel' => 'whatsapp',
                                    'scheduled_for' => $tomorrowStart,
                                ],
                                [
                                    'title' => 'Hearing reminder',
                                    'body' => 'Reminder: hearing scheduled for tomorrow.',
                                    'status' => 'pending',
                                ]
                            );

                        if ($waNotification->wasRecentlyCreated) {
                            SendWhatsAppNotificationJob::dispatch(
                                $hearing->tenant_id,
                                $waNotification->id
                            );
                        }
                    }
                }

                Log::info('hearings.reminder.scheduled', [
                    'tenant_id' => $hearing->tenant_id,
                    'hearing_id' => $hearing->id,
                ]);
            } finally {
                TenantContext::clear();
            }
        }

        return Command::SUCCESS;
    }
}
