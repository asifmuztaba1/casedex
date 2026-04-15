<?php

namespace App\Domain\Notifications\Actions;

use App\Domain\Auth\Enums\UserRole;
use App\Domain\Cases\Models\CaseParticipant;
use App\Domain\Documents\Models\Document;
use App\Domain\Hearings\Models\Hearing;
use App\Domain\Notifications\Models\CaseNotification;
use App\Models\User;
use Illuminate\Support\Carbon;

class BuildDailyBriefingAction
{
    /**
     * Compute today's daily briefing payload for a user.
     *
     * Returns a structured array used by both the scheduled send command
     * and the on-demand API endpoint (greeting modal).
     *
     * @return array<string, mixed>
     */
    public function handle(User $user, ?Carbon $date = null): array
    {
        $date = ($date ?? Carbon::now())->copy();
        $todayStart = $date->copy()->startOfDay();
        $todayEnd = $date->copy()->endOfDay();
        $yesterdayStart = $date->copy()->subDay()->startOfDay();
        $yesterdayEnd = $date->copy()->subDay()->endOfDay();

        $caseIds = $this->caseIdsForUser($user);

        $hearingsToday = Hearing::query()
            ->where('tenant_id', $user->tenant_id)
            ->whereIn('case_id', $caseIds)
            ->whereBetween('hearing_at', [$todayStart, $todayEnd])
            ->orderBy('hearing_at')
            ->with('case:id,public_id,title,court,court_id')
            ->with('case.court:id,name')
            ->get();

        $first = $hearingsToday->first();
        $firstHearing = null;
        if ($first !== null) {
            $courtName = $first->case?->court?->name ?? $first->case?->court ?? null;
            $firstHearing = [
                'at' => $first->hearing_at,
                'case_title' => $first->case?->title,
                'case_public_id' => $first->case?->public_id,
                'court' => $courtName,
            ];
        }

        $pendingOutcomesYesterday = Hearing::query()
            ->where('tenant_id', $user->tenant_id)
            ->whereIn('case_id', $caseIds)
            ->whereBetween('hearing_at', [$yesterdayStart, $yesterdayEnd])
            ->whereNull('outcome')
            ->count();

        $documentDeadlinesToday = Document::query()
            ->where('tenant_id', $user->tenant_id)
            ->whereIn('case_id', $caseIds)
            ->whereBetween('due_at', [$todayStart, $todayEnd])
            ->count();

        $causeListMatchesToday = CaseNotification::query()
            ->where('tenant_id', $user->tenant_id)
            ->where('user_id', $user->id)
            ->where('notification_type', 'cause_list_listing')
            ->whereBetween('scheduled_for', [$todayStart, $todayEnd])
            ->count();

        $hearingsCount = $hearingsToday->count();

        return [
            'date' => $date->toDateString(),
            'hearings_today' => $hearingsCount,
            'first_hearing' => $firstHearing,
            'pending_outcomes_yesterday' => $pendingOutcomesYesterday,
            'document_deadlines_today' => $documentDeadlinesToday,
            'cause_list_matches_today' => $causeListMatchesToday,
            'has_any' => $hearingsCount > 0
                || $pendingOutcomesYesterday > 0
                || $documentDeadlinesToday > 0
                || $causeListMatchesToday > 0,
        ];
    }

    /**
     * Return the case IDs this user participates in (explicit participants
     * plus, for admins, all tenant cases).
     *
     * @return array<int, int>
     */
    private function caseIdsForUser(User $user): array
    {
        $explicit = CaseParticipant::query()
            ->where('tenant_id', $user->tenant_id)
            ->where('user_id', $user->id)
            ->pluck('case_id')
            ->all();

        if ($user->role === UserRole::Admin) {
            $allCases = \App\Domain\Cases\Models\CaseFile::query()
                ->where('tenant_id', $user->tenant_id)
                ->pluck('id')
                ->all();

            return array_values(array_unique(array_merge($explicit, $allCases)));
        }

        return array_values(array_unique($explicit));
    }
}
