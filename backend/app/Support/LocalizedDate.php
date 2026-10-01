<?php

namespace App\Support;

use Carbon\CarbonInterface;

final class LocalizedDate
{
    /**
     * Human date-time for emails and notifications, e.g. "2 October 2026, 10:30 AM"
     * or "২ অক্টোবর ২০২৬, ১০:৩০ পূর্বাহ্ণ". Hearing times are stored as the
     * wall-clock time the user entered, so no timezone conversion happens here.
     */
    public static function dateTime(?CarbonInterface $value, ?string $locale = null): string
    {
        if ($value === null) {
            return '';
        }

        $locale ??= app()->getLocale();
        $text = $value->copy()->locale($locale)->translatedFormat('j F Y, g:i A');

        return $locale === 'bn' ? BanglaDigits::toBangla($text) : $text;
    }

    public static function date(?CarbonInterface $value, ?string $locale = null): string
    {
        if ($value === null) {
            return '';
        }

        $locale ??= app()->getLocale();
        $text = $value->copy()->locale($locale)->translatedFormat('j F Y');

        return $locale === 'bn' ? BanglaDigits::toBangla($text) : $text;
    }
}
