<?php

namespace App\Support;

use Carbon\CarbonInterface;

/**
 * Hearing times, diary entry times and document due dates are stored as the
 * wall-clock time the user typed (e.g. "2026-10-20 10:00" in Dhaka), not as
 * UTC instants. Backend date logic (reminders, daily register, cause list)
 * relies on that. Serialize them without a timezone suffix so browsers read
 * them as local time; a trailing "Z" made Bangladesh users see 10:00 as 16:00.
 */
final class WallClock
{
    public static function toJson(?CarbonInterface $value): ?string
    {
        return $value?->format('Y-m-d\TH:i:s');
    }
}
