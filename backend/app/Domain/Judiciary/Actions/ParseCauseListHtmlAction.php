<?php

namespace App\Domain\Judiciary\Actions;

use App\Domain\Judiciary\Dto\CauseListRow;
use App\Support\BanglaDigits;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Symfony\Component\DomCrawler\Crawler;

class ParseCauseListHtmlAction
{
    /**
     * @return Collection<int, CauseListRow>
     */
    public function handle(string $html): Collection
    {
        $crawler = new Crawler($html);
        $rows = new Collection;

        $crawler->filter('table tbody tr')->each(function (Crawler $tr) use ($rows): void {
            $cells = $tr->filter('td');
            if ($cells->count() < 5) {
                return;
            }

            $serial = $this->parseInt($cells->eq(0)->text(''));
            $caseCell = trim($cells->eq(1)->text(''));
            $activity = $this->nullableText($cells->eq(2)->text(''));
            $nextDate = $this->parseNextDate($cells->eq(3)->text(''));
            $briefOrder = $this->nullableText($cells->eq(4)->text(''));

            [$typeBn, $caseSerial, $caseYear] = $this->parseCaseIdentifier($caseCell);
            if ($typeBn === null || $caseSerial === null || $caseYear === null) {
                return;
            }

            $rows->push(new CauseListRow(
                serial: $serial ?? 0,
                caseTypeBn: $typeBn,
                caseSerial: $caseSerial,
                caseYear: $caseYear,
                activity: $activity,
                nextDate: $nextDate,
                briefOrder: $briefOrder,
            ));
        });

        return $rows;
    }

    /**
     * @return array{0: ?string, 1: ?int, 2: ?int}
     */
    private function parseCaseIdentifier(string $raw): array
    {
        $text = trim(BanglaDigits::toEnglish($raw));
        if ($text === '') {
            return [null, null, null];
        }

        // Expected shape: "<type> - <serial>/<year>"
        if (! preg_match('/^(.+?)\s*-\s*(\d+)\s*\/\s*(\d{4})\s*$/u', $text, $m)) {
            return [null, null, null];
        }

        $type = trim($m[1]);
        $type = preg_replace('/\s+/u', ' ', $type) ?? $type;

        return [$type, (int) $m[2], (int) $m[3]];
    }

    private function parseNextDate(string $raw): ?Carbon
    {
        $text = trim(BanglaDigits::toEnglish($raw));
        if ($text === '') {
            return null;
        }

        // e.g. "01-07-2026 খ্রিঃ" → "01-07-2026"
        if (! preg_match('/(\d{2})-(\d{2})-(\d{4})/', $text, $m)) {
            return null;
        }

        try {
            return Carbon::createFromFormat('d-m-Y', "{$m[1]}-{$m[2]}-{$m[3]}")->startOfDay();
        } catch (\Throwable) {
            return null;
        }
    }

    private function parseInt(string $raw): ?int
    {
        $text = trim(BanglaDigits::toEnglish($raw));
        if ($text === '' || ! preg_match('/\d+/', $text, $m)) {
            return null;
        }

        return (int) $m[0];
    }

    private function nullableText(string $raw): ?string
    {
        $text = trim(preg_replace('/\s+/u', ' ', $raw) ?? '');

        return $text === '' ? null : $text;
    }
}
