<?php

namespace App\Jobs;

use App\Domain\Courts\Models\Court;
use App\Domain\Judiciary\Actions\CreateCauseListNotificationAction;
use App\Domain\Judiciary\Actions\FetchCauseListHtmlAction;
use App\Domain\Judiciary\Actions\MatchCauseListRowAction;
use App\Domain\Judiciary\Actions\ParseCauseListHtmlAction;
use App\Support\TenantContext;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

class ScrapeJudiciaryCauseListJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public int $tries = 3;

    /** @var array<int, int> */
    public array $backoff = [60, 300, 900];

    public function __construct(
        public int $tenantId,
        public int $courtId,
        public string $dateYmd,
    ) {
    }

    public function handle(
        FetchCauseListHtmlAction $fetch,
        ParseCauseListHtmlAction $parse,
        MatchCauseListRowAction $match,
        CreateCauseListNotificationAction $notify,
    ): void {
        TenantContext::set($this->tenantId);

        try {
            $date = Carbon::parse($this->dateYmd)->startOfDay();
            $ddmmyyyy = $date->format('d-m-Y');

            $court = Court::query()->find($this->courtId);
            if ($court === null) {
                $this->logAttempt('failed', 0, 0, 0, 'court_not_found', $date);

                return;
            }

            $portalId = (int) ($court->judiciary_portal_court_id ?? 0);
            if ($portalId === 0) {
                $this->logAttempt('failed', 0, 0, 0, 'portal_id_missing', $date);

                return;
            }

            try {
                $html = $fetch->handle($portalId, $ddmmyyyy);
            } catch (Throwable $e) {
                $this->logAttempt('failed', 0, 0, 0, $e->getMessage(), $date);

                throw $e;
            }

            $rows = $parse->handle($html);

            if ($rows->isEmpty()) {
                $this->logAttempt('empty', 0, 0, 0, null, $date);
                $this->markSynced($court);

                return;
            }

            $matchCount = 0;
            $notificationCount = 0;

            foreach ($rows as $row) {
                $matched = $match->handle($row, $court->id);
                foreach ($matched as $case) {
                    $matchCount++;
                    $notificationCount += $notify->handle(
                        $case,
                        $row,
                        $date,
                        $court->displayName(app()->getLocale()),
                    );
                }
            }

            $this->logAttempt('ok', $rows->count(), $matchCount, $notificationCount, null, $date);
            $this->markSynced($court);

            Log::info('judiciary.causelist.scraped', [
                'tenant_id' => $this->tenantId,
                'court_id' => $court->id,
                'portal_court_id' => $portalId,
                'date' => $this->dateYmd,
                'rows' => $rows->count(),
                'matches' => $matchCount,
                'notifications' => $notificationCount,
            ]);
        } finally {
            TenantContext::clear();
        }
    }

    private function markSynced(Court $court): void
    {
        $court->forceFill(['last_causelist_synced_at' => now()])->save();
    }

    private function logAttempt(
        string $status,
        int $rows,
        int $matches,
        int $notifications,
        ?string $error,
        Carbon $date,
    ): void {
        DB::table('judiciary_causelist_logs')->updateOrInsert(
            [
                'tenant_id' => $this->tenantId,
                'court_id' => $this->courtId,
                'cause_list_date' => $date->toDateString(),
            ],
            [
                'status' => $status,
                'row_count' => $rows,
                'match_count' => $matches,
                'notification_count' => $notifications,
                'error' => $error,
                'scraped_at' => now(),
                'updated_at' => now(),
                'created_at' => now(),
            ]
        );
    }
}
