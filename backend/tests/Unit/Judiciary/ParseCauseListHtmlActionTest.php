<?php

use App\Domain\Judiciary\Actions\ParseCauseListHtmlAction;
use App\Domain\Judiciary\Dto\CauseListRow;

it('parses the munshiganj fixture into structured rows', function () {
    $html = file_get_contents(__DIR__.'/../../fixtures/judiciary/causelist_munshiganj_59.html');

    $rows = (new ParseCauseListHtmlAction)->handle($html);

    expect($rows)->toHaveCount(38);
    expect($rows->first())->toBeInstanceOf(CauseListRow::class);
});

it('returns the first row with bangla type, english digits and parsed next date', function () {
    $html = file_get_contents(__DIR__.'/../../fixtures/judiciary/causelist_munshiganj_59.html');

    /** @var CauseListRow $first */
    $first = (new ParseCauseListHtmlAction)->handle($html)->first();

    expect($first->serial)->toBe(1);
    expect($first->caseTypeBn)->toBe('অর্পিত আপীল');
    expect($first->caseSerial)->toBe(28);
    expect($first->caseYear)->toBe(2018);
    expect($first->nextDate?->toDateString())->toBe('2026-07-01');
});

it('returns empty collection for html without a cause list table', function () {
    $html = '<html><body><p>No table here</p></body></html>';

    expect((new ParseCauseListHtmlAction)->handle($html))->toHaveCount(0);
});

it('ignores rows whose case identifier does not match the expected shape', function () {
    $html = <<<'HTML'
<html><body><table><tbody>
<tr><td>১</td><td>গারবেজ সেল</td><td>শুনানী</td><td></td><td></td></tr>
<tr><td>২</td><td>দেওয়ানী আপীল - ৬৬/২০২৩</td><td>শুনানী</td><td>০১-০৭-২০২৬</td><td></td></tr>
</tbody></table></body></html>
HTML;

    $rows = (new ParseCauseListHtmlAction)->handle($html);

    expect($rows)->toHaveCount(1);
    expect($rows->first()->caseTypeBn)->toBe('দেওয়ানী আপীল');
    expect($rows->first()->caseSerial)->toBe(66);
    expect($rows->first()->caseYear)->toBe(2023);
});
