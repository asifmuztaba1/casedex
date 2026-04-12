<?php

namespace App\Support;

class BanglaDigits
{
    private const BN_TO_EN = [
        '০' => '0', '১' => '1', '২' => '2', '৩' => '3', '৪' => '4',
        '৫' => '5', '৬' => '6', '৭' => '7', '৮' => '8', '৯' => '9',
    ];

    private const EN_TO_BN = [
        '0' => '০', '1' => '১', '2' => '২', '3' => '৩', '4' => '৪',
        '5' => '৫', '6' => '৬', '7' => '৭', '8' => '৮', '9' => '৯',
    ];

    public static function toEnglish(string $value): string
    {
        return strtr($value, self::BN_TO_EN);
    }

    public static function toBangla(string $value): string
    {
        return strtr($value, self::EN_TO_BN);
    }
}
