<?php

namespace App\Domain\Judiciary\Actions;

use Illuminate\Support\Facades\Http;
use RuntimeException;

class FetchCauseListHtmlAction
{
    private const BASE_URL = 'https://causelist.judiciary.gov.bd/causelist';

    private const USER_AGENT = 'CaseDex/1.0 (+contact@casedex.app)';

    public function handle(int $portalCourtId, string $dateDdMmYyyy): string
    {
        $response = Http::withHeaders([
            'User-Agent' => self::USER_AGENT,
            'Accept' => 'text/html,application/xhtml+xml',
            'Accept-Language' => 'bn,en;q=0.8',
        ])
            ->timeout(20)
            ->retry(2, 1500)
            ->get(self::BASE_URL, [
                'courtId' => $portalCourtId,
                'date' => $dateDdMmYyyy,
            ]);

        if (! $response->successful()) {
            throw new RuntimeException(
                "judiciary.causelist.fetch_failed: status={$response->status()} court={$portalCourtId} date={$dateDdMmYyyy}"
            );
        }

        return $response->body();
    }
}
