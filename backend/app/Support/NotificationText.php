<?php

namespace App\Support;

use App\Models\User;

/**
 * Notification titles and bodies are stored as text, so write them in the
 * recipient's language at creation time (lang/{en,bn}/notifications.php).
 */
final class NotificationText
{
    public static function localeFor(?User $user): string
    {
        $locale = $user?->locale;

        return in_array($locale, ['en', 'bn'], true) ? $locale : (string) config('app.locale', 'en');
    }

    /**
     * @param  array<string, string|int|float>  $replace
     */
    public static function get(?User $user, string $key, array $replace = []): string
    {
        $locale = self::localeFor($user);
        if ($locale === 'bn') {
            $replace = array_map(
                fn ($value) => is_int($value) || is_float($value) ? BanglaDigits::toBangla((string) $value) : $value,
                $replace
            );
        }

        return __("notifications.{$key}", $replace, $locale);
    }

    /**
     * Pluralised variant (uses trans_choice).
     *
     * @param  array<string, string|int|float>  $replace
     */
    public static function choice(?User $user, string $key, int $count, array $replace = []): string
    {
        $locale = self::localeFor($user);
        $replace = ['days' => $count] + $replace;
        if ($locale === 'bn') {
            $replace = array_map(
                fn ($value) => is_int($value) || is_float($value) ? BanglaDigits::toBangla((string) $value) : $value,
                $replace
            );
        }

        return trans_choice("notifications.{$key}", $count, $replace, $locale);
    }
}
