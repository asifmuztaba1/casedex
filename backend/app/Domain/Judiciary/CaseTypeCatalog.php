<?php

namespace App\Domain\Judiciary;

class CaseTypeCatalog
{
    /**
     * Bangla registry case type → normalized slug.
     *
     * Derived from Bangladesh Judiciary cause list portal recon.
     * Extend as new types are observed in scraped rows.
     */
    public const TYPES = [
        'দেওয়ানী আপীল' => 'civil_appeal',
        'ফৌজদারী আপীল' => 'criminal_appeal',
        'দেওয়ানী রিভিশন' => 'civil_revision',
        'ফৌজদারী রিভিশন' => 'criminal_revision',
        'দেওয়ানী বিবিধ মামলা' => 'civil_misc',
        'ফৌজদারী বিবিধ মামলা' => 'criminal_misc',
        'অর্পিত আপীল' => 'entrusted_appeal',
        'পারিবারিক আপিল' => 'family_appeal',
        'পারিবারিক মামলা' => 'family_case',
        'মিস লুনাসি' => 'misc_lunacy',
        'মিস মামলা' => 'misc_case',
        'ফৌজদারী মামলা' => 'criminal_case',
        'দেওয়ানী মামলা' => 'civil_case',
        'রেন্ট মামলা' => 'rent_case',
        'রেন্ট আপিল' => 'rent_appeal',
        'মানিলোন মামলা' => 'money_loan_case',
        'মানিলোন এ্যাপীল' => 'money_loan_appeal',
        'অর্থ ঋণ মামলা' => 'money_loan_case_artharin',
        'দায়রা মামলা' => 'sessions_case',
    ];

    /**
     * Display labels in English (optional translation layer).
     */
    public const EN_LABELS = [
        'civil_appeal' => 'Civil Appeal',
        'criminal_appeal' => 'Criminal Appeal',
        'civil_revision' => 'Civil Revision',
        'criminal_revision' => 'Criminal Revision',
        'civil_misc' => 'Civil Miscellaneous',
        'criminal_misc' => 'Criminal Miscellaneous',
        'entrusted_appeal' => 'Entrusted Appeal',
        'family_appeal' => 'Family Appeal',
        'family_case' => 'Family Case',
        'misc_lunacy' => 'Lunacy Miscellaneous',
        'misc_case' => 'Miscellaneous Case',
        'criminal_case' => 'Criminal Case',
        'civil_case' => 'Civil Case',
        'rent_case' => 'Rent Case',
        'rent_appeal' => 'Rent Appeal',
        'money_loan_case' => 'Money Loan Case',
        'money_loan_appeal' => 'Money Loan Appeal',
        'money_loan_case_artharin' => 'Artha Rin (Money Loan) Case',
        'sessions_case' => 'Sessions Case',
    ];

    public static function slugFor(string $banglaName): ?string
    {
        $normalized = self::normalize($banglaName);

        foreach (self::TYPES as $bn => $slug) {
            if (self::normalize($bn) === $normalized) {
                return $slug;
            }
        }

        return null;
    }

    public static function normalize(string $banglaName): string
    {
        return trim(preg_replace('/\s+/u', ' ', $banglaName) ?? '');
    }

    /**
     * All known bangla names (for dropdown population).
     *
     * @return array<int, array{bn: string, slug: string, en: string}>
     */
    public static function all(): array
    {
        $out = [];
        foreach (self::TYPES as $bn => $slug) {
            $out[] = [
                'bn' => $bn,
                'slug' => $slug,
                'en' => self::EN_LABELS[$slug] ?? $slug,
            ];
        }

        return $out;
    }
}
