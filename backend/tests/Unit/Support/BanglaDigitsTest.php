<?php

use App\Support\BanglaDigits;

it('converts bangla digits to english', function () {
    expect(BanglaDigits::toEnglish('০১২৩৪৫৬৭৮৯'))->toBe('0123456789');
});

it('converts english digits to bangla', function () {
    expect(BanglaDigits::toBangla('0123456789'))->toBe('০১২৩৪৫৬৭৮৯');
});

it('leaves non-digit characters untouched when converting to english', function () {
    expect(BanglaDigits::toEnglish('মামলা নং ১২৩/২০২৫'))->toBe('মামলা নং 123/2025');
});

it('leaves non-digit characters untouched when converting to bangla', function () {
    expect(BanglaDigits::toBangla('Case 42 of 2026'))->toBe('Case ৪২ of ২০২৬');
});

it('is a no-op for empty strings', function () {
    expect(BanglaDigits::toEnglish(''))->toBe('');
    expect(BanglaDigits::toBangla(''))->toBe('');
});
