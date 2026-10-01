<?php

namespace App\Domain\Judiciary\Actions;

use App\Domain\Auth\Enums\UserRole;
use App\Domain\Cases\Models\CaseFile;
use App\Domain\Judiciary\Dto\CauseListRow;
use App\Domain\Notifications\Models\CaseNotification;
use App\Models\User;
use Illuminate\Support\Carbon;
use App\Support\NotificationText;
use App\Support\LocalizedDate;

class CreateCauseListNotificationAction
{
    /**
     * Create in-app notifications for each participant of the matched case.
     * Idempotent via firstOrCreate on (case_id, user_id, notification_type, scheduled_for).
     *
     * Returns the number of newly created notifications.
     */
    public function handle(
        CaseFile $case,
        CauseListRow $row,
        Carbon $causeListDate,
        string $courtName,
    ): int {
        $participants = $case->participants()->with('user')->get();
        $participantUserIds = $participants->pluck('user_id')->all();

        $admins = User::query()
            ->where('tenant_id', $case->tenant_id)
            ->where('role', UserRole::Admin)
            ->get();

        foreach ($admins as $admin) {
            if (! in_array($admin->id, $participantUserIds, true)) {
                $participants->push((object) [
                    'user_id' => $admin->id,
                    'user' => $admin,
                ]);
            }
        }

        // Text is written per recipient below, in their language.
        $listing = [
            'type' => $row->caseTypeBn,
            'serial' => (int) $row->caseSerial,
            'year' => (int) $row->caseYear,
            'court' => $courtName,
            'date' => $causeListDate->toDateString(),
            'activity' => $row->activity ?? '-',
        ];

        $created = 0;
        foreach ($participants as $participant) {
            if ($participant->user === null) {
                continue;
            }

            $notification = CaseNotification::query()->firstOrCreate(
                [
                    'tenant_id' => $case->tenant_id,
                    'case_id' => $case->id,
                    'user_id' => $participant->user_id,
                    'notification_type' => 'cause_list_listing',
                    'channel' => 'in_app',
                    'scheduled_for' => $causeListDate->startOfDay(),
                ],
                [
                    'title' => NotificationText::get($participant->user, 'cause_list_title', $listing),
                    'body' => NotificationText::get($participant->user, 'cause_list_body', [
                        'date' => LocalizedDate::date($causeListDate, NotificationText::localeFor($participant->user)),
                    ] + $listing)
                        .($row->nextDate !== null
                            ? NotificationText::get($participant->user, 'cause_list_next_date', [
                                'date' => LocalizedDate::date($row->nextDate, NotificationText::localeFor($participant->user)),
                            ])
                            : ''),
                    'status' => 'pending',
                ]
            );

            if ($notification->wasRecentlyCreated) {
                $created++;
            }
        }

        return $created;
    }
}
