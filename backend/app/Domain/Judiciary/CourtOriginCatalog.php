<?php

namespace App\Domain\Judiciary;

class CourtOriginCatalog
{
    /**
     * Portal office_origin_id → canonical court type metadata.
     *
     * Derived from Bangladesh Judiciary cause list portal recon.
     * The English/Bangla labels here are the AUTHORITATIVE type names
     * used to upsert rows into `court_types`.
     *
     * @var array<int, array{en: string, bn: string}>
     */
    public const ORIGINS = [
        4 => ['en' => 'District and Sessions Judge Court',         'bn' => 'জেলা ও দায়রা জজ আদালত'],
        5 => ['en' => 'Additional District and Sessions Judge Court', 'bn' => 'অতিরিক্ত জেলা ও দায়রা জজ আদালত'],
        6 => ['en' => 'Joint District and Sessions Judge Court',   'bn' => 'যুগ্ম জেলা ও দায়রা জজ আদালত'],
        7 => ['en' => 'Senior Assistant Judge Court',              'bn' => 'সিনিয়র সহকারী জজ আদালত'],
        8 => ['en' => 'Assistant Judge Court',                     'bn' => 'সহকারী জজ আদালত'],
        9 => ['en' => 'Nari O Shishu Nirjatan Daman Tribunal',     'bn' => 'নারী ও শিশু নির্যাতন দমন ট্রাইব্যুনাল'],
        10 => ['en' => 'Metropolitan Sessions Judge Court',        'bn' => 'মহানগর দায়রা জজ আদালত'],
        11 => ['en' => 'Additional Metropolitan Sessions Judge Court', 'bn' => 'অতিরিক্ত মহানগর দায়রা জজ আদালত'],
        12 => ['en' => 'Joint Metropolitan Sessions Judge Court',  'bn' => 'যুগ্ম মহানগর দায়রা জজ আদালত'],
        13 => ['en' => 'Chief Metropolitan Magistrate Court',      'bn' => 'চিফ মেট্রোপলিটন ম্যাজিস্ট্রেট আদালত'],
        14 => ['en' => 'Chief Judicial Magistrate Court',          'bn' => 'চিফ জুডিশিয়াল ম্যাজিস্ট্রেট আদালত'],
        15 => ['en' => 'Additional Chief Judicial Magistrate Court', 'bn' => 'অতিরিক্ত চীফ জুডিসিয়াল ম্যাজিস্ট্রেট আদালত'],
        16 => ['en' => 'Senior Judicial Magistrate Court',         'bn' => 'সিনিয়র জুডিসিয়াল ম্যাজিস্ট্রেট আদালত'],
        17 => ['en' => 'Judicial Magistrate Court',                'bn' => 'জুডিশিয়াল ম্যাজিস্ট্রেট আদালত'],
        18 => ['en' => 'Land Survey Tribunal',                     'bn' => 'ভূমি জরিপ ট্রাইব্যুনাল'],
        20 => ['en' => 'Money Loan Court (Artha Rin Adalat)',      'bn' => 'অর্থ ঋণ আদালত'],
        21 => ['en' => 'Arbitration Court',                        'bn' => 'আরবিট্রেশন আদালত'],
        22 => ['en' => 'Additional Chief Metropolitan Magistrate Court', 'bn' => 'অতিরিক্ত চীফ মেট্রোপলিটন ম্যাজিস্ট্রেট আদালত'],
        23 => ['en' => 'Metropolitan Magistrate Court',            'bn' => 'মেট্রোপলিটন ম্যাজিস্ট্রেট আদালত'],
        24 => ['en' => 'Special Magistrate Court',                 'bn' => 'স্পেশাল ম্যাজিস্ট্রেট আদালত'],
        72 => ['en' => 'Speedy Trial Tribunal',                    'bn' => 'দ্রুত বিচার ট্রাইব্যুনাল'],
        73 => ['en' => 'Special Judge Court',                      'bn' => 'বিশেষ জজ আদালত'],
        74 => ['en' => 'Environment Court',                        'bn' => 'পরিবেশ আদালত'],
        75 => ['en' => 'Environmental Court of Appeal',            'bn' => 'পরিবেশ আপীল আদালত'],
        76 => ['en' => 'Divisional Special Judge Court',           'bn' => 'বিভাগীয় বিশেষ জজ আদালত'],
        77 => ['en' => 'Public Safety Crime Suppression Tribunal', 'bn' => 'জন নিরাপত্তা বিঘ্নকারী অপরাধ দমন ট্রাইব্যুনাল'],
        79 => ['en' => 'Anti-Terrorism Special Tribunal',          'bn' => 'সন্ত্রাস বিরোধী বিশেষ ট্রাইব্যুনাল'],
        80 => ['en' => 'Human Trafficking Crime Suppression Tribunal', 'bn' => 'মানব পাচার অপরাধ দমন ট্রাইব্যুনাল'],
        81 => ['en' => 'Labour Court',                             'bn' => 'শ্রম আদালত'],
        82 => ['en' => 'Administrative Tribunal',                  'bn' => 'প্রশাসনিক ট্রাইব্যুনাল'],
        84 => ['en' => 'Power Court',                              'bn' => 'বিদ্যুৎ আদালত'],
        86 => ['en' => 'Cyber Tribunal',                           'bn' => 'সাইবার ট্রাইব্যুনাল'],
        87 => ['en' => 'Divisional Speedy Trial Tribunal',         'bn' => 'বিভাগীয় দ্রুত বিচার ট্রাইব্যুনাল'],
        91 => ['en' => 'Cognizance Court (Amli)',                  'bn' => 'আমলী আদালত'],
        92 => ['en' => 'Metropolitan Cognizance Court (Metro Amli)', 'bn' => 'মেট্রোপলিটন আমলী আদালত'],
        100 => ['en' => 'Special Metropolitan Magistrate Marine Court', 'bn' => 'স্পেশাল মেট্রোপলিটন ম্যাজিস্ট্রেট মেরিন আদালত'],
        102 => ['en' => 'Labour Appellate Tribunal',               'bn' => 'শ্রম আপীল ট্রাইব্যুনাল'],
        103 => ['en' => 'Family Court',                            'bn' => 'পারিবারিক আদালত'],
        104 => ['en' => 'Child Rape Suppression Tribunal',         'bn' => 'শিশু ধর্ষণ অপরাধ দমন ট্রাইব্যুনাল'],
        105 => ['en' => 'Family Appeal Court',                     'bn' => 'পারিবারিক আপিল আদালত'],
        109 => ['en' => 'Special Tribunal',                        'bn' => 'বিশেষ ট্রাইব্যুনাল'],
        110 => ['en' => 'Land Survey Appellate Tribunal',          'bn' => 'ল্যান্ড সার্ভে আপিল ট্রাইব্যুনাল'],
        111 => ['en' => 'Enforced Disappearance Prevention Tribunal', 'bn' => 'গুম প্রতিরোধ ও প্রতিকার ট্রাইব্যুনাল'],
        112 => ['en' => 'Commercial Court',                        'bn' => 'বাণিজ্যিক আদালত'],
    ];

    /**
     * Flat list of all origin IDs — used by the HTTP enumerator.
     *
     * @return array<int, int>
     */
    public static function ids(): array
    {
        return array_keys(self::ORIGINS);
    }

    /**
     * @return array{en: string, bn: string}|null
     */
    public static function find(int $originId): ?array
    {
        return self::ORIGINS[$originId] ?? null;
    }
}
