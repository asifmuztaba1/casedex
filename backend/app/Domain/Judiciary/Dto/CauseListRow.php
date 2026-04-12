<?php

namespace App\Domain\Judiciary\Dto;

use Illuminate\Support\Carbon;

final readonly class CauseListRow
{
    public function __construct(
        public int $serial,
        public string $caseTypeBn,
        public int $caseSerial,
        public int $caseYear,
        public ?string $activity,
        public ?Carbon $nextDate,
        public ?string $briefOrder,
    ) {
    }
}
