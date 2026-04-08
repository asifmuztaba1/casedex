<?php

namespace Database\Seeders;

use App\Domain\Courts\Models\Court;
use App\Domain\Courts\Models\CourtDistrict;
use App\Domain\Courts\Models\CourtDivision;
use App\Domain\Courts\Models\CourtType;
use App\Domain\Tenancy\Models\Country;
use Illuminate\Database\Seeder;

class BangladeshCourtSeeder extends Seeder
{
    public function run(): void
    {
        $country = Country::query()->where('code', 'BD')->first();

        if (! $country) {
            $this->command->warn('Country BD not found. Run CountriesSeeder first.');

            return;
        }

        $countryId = $country->id;

        // ─── Divisions ──────────────────────────────────────────────
        $divisions = [
            'Barishal'   => 'বরিশাল',
            'Chattogram' => 'চট্টগ্রাম',
            'Dhaka'      => 'ঢাকা',
            'Khulna'     => 'খুলনা',
            'Mymensingh' => 'ময়মনসিংহ',
            'Rajshahi'   => 'রাজশাহী',
            'Rangpur'    => 'রংপুর',
            'Sylhet'     => 'সিলেট',
        ];

        $divisionModels = [];
        foreach ($divisions as $en => $bn) {
            $divisionModels[$en] = CourtDivision::query()->firstOrCreate(
                ['country_id' => $countryId, 'name' => $en],
                ['name_bn' => $bn]
            );
        }

        // ─── Districts ──────────────────────────────────────────────
        $districts = [
            'Barishal' => [
                'Barguna'  => 'বরগুনা',
                'Barishal' => 'বরিশাল',
                'Bhola'    => 'ভোলা',
                'Jhalokati' => 'ঝালকাঠি',
                'Patuakhali' => 'পটুয়াখালী',
                'Pirojpur' => 'পিরোজপুর',
            ],
            'Chattogram' => [
                'Bandarban'    => 'বান্দরবান',
                'Brahmanbaria' => 'ব্রাহ্মণবাড়িয়া',
                'Chandpur'     => 'চাঁদপুর',
                'Chattogram'   => 'চট্টগ্রাম',
                'Comilla'      => 'কুমিল্লা',
                'Cox\'s Bazar' => 'কক্সবাজার',
                'Feni'         => 'ফেনী',
                'Khagrachhari' => 'খাগড়াছড়ি',
                'Lakshmipur'   => 'লক্ষ্মীপুর',
                'Noakhali'     => 'নোয়াখালী',
                'Rangamati'    => 'রাঙ্গামাটি',
            ],
            'Dhaka' => [
                'Dhaka'        => 'ঢাকা',
                'Faridpur'     => 'ফরিদপুর',
                'Gazipur'      => 'গাজীপুর',
                'Gopalganj'    => 'গোপালগঞ্জ',
                'Kishoreganj'  => 'কিশোরগঞ্জ',
                'Madaripur'    => 'মাদারীপুর',
                'Manikganj'    => 'মানিকগঞ্জ',
                'Munshiganj'   => 'মুন্সিগঞ্জ',
                'Narayanganj'  => 'নারায়ণগঞ্জ',
                'Narsingdi'    => 'নরসিংদী',
                'Rajbari'      => 'রাজবাড়ী',
                'Shariatpur'   => 'শরীয়তপুর',
                'Tangail'      => 'টাঙ্গাইল',
            ],
            'Khulna' => [
                'Bagerhat'    => 'বাগেরহাট',
                'Chuadanga'   => 'চুয়াডাঙ্গা',
                'Jessore'     => 'যশোর',
                'Jhenaidah'   => 'ঝিনাইদহ',
                'Khulna'      => 'খুলনা',
                'Kushtia'     => 'কুষ্টিয়া',
                'Magura'      => 'মাগুরা',
                'Meherpur'    => 'মেহেরপুর',
                'Narail'      => 'নড়াইল',
                'Satkhira'    => 'সাতক্ষীরা',
            ],
            'Mymensingh' => [
                'Jamalpur'    => 'জামালপুর',
                'Mymensingh'  => 'ময়মনসিংহ',
                'Netrokona'   => 'নেত্রকোনা',
                'Sherpur'     => 'শেরপুর',
            ],
            'Rajshahi' => [
                'Bogura'     => 'বগুড়া',
                'Chapainawabganj' => 'চাঁপাইনবাবগঞ্জ',
                'Joypurhat'  => 'জয়পুরহাট',
                'Naogaon'    => 'নওগাঁ',
                'Natore'     => 'নাটোর',
                'Nawabganj'  => 'নবাবগঞ্জ',
                'Pabna'      => 'পাবনা',
                'Rajshahi'   => 'রাজশাহী',
                'Sirajganj'  => 'সিরাজগঞ্জ',
            ],
            'Rangpur' => [
                'Dinajpur'    => 'দিনাজপুর',
                'Gaibandha'   => 'গাইবান্ধা',
                'Kurigram'    => 'কুড়িগ্রাম',
                'Lalmonirhat' => 'লালমনিরহাট',
                'Nilphamari'  => 'নীলফামারী',
                'Panchagarh'  => 'পঞ্চগড়',
                'Rangpur'     => 'রংপুর',
                'Thakurgaon'  => 'ঠাকুরগাঁও',
            ],
            'Sylhet' => [
                'Habiganj'    => 'হবিগঞ্জ',
                'Moulvibazar' => 'মৌলভীবাজার',
                'Sunamganj'   => 'সুনামগঞ্জ',
                'Sylhet'      => 'সিলেট',
            ],
        ];

        $districtModels = [];
        foreach ($districts as $divisionName => $districtList) {
            $division = $divisionModels[$divisionName];
            foreach ($districtList as $en => $bn) {
                $districtModels[$en] = CourtDistrict::query()->firstOrCreate(
                    ['country_id' => $countryId, 'division_id' => $division->id, 'name' => $en],
                    ['name_bn' => $bn]
                );
            }
        }

        // ─── Court Types ────────────────────────────────────────────
        $courtTypes = [
            'Supreme Court (Appellate Division)'       => 'সুপ্রিম কোর্ট (আপিল বিভাগ)',
            'Supreme Court (High Court Division)'      => 'সুপ্রিম কোর্ট (হাইকোর্ট বিভাগ)',
            'District and Sessions Judge Court'        => 'জেলা ও দায়রা জজ আদালত',
            'Additional District and Sessions Judge Court' => 'অতিরিক্ত জেলা ও দায়রা জজ আদালত',
            'Joint District and Sessions Judge Court'  => 'যৌথ জেলা ও দায়রা জজ আদালত',
            'Senior Assistant Judge Court'             => 'সিনিয়র সহকারী জজ আদালত',
            'Assistant Judge Court'                    => 'সহকারী জজ আদালত',
            'Chief Judicial Magistrate Court'          => 'চিফ জুডিশিয়াল ম্যাজিস্ট্রেট আদালত',
            'Judicial Magistrate Court'                => 'জুডিশিয়াল ম্যাজিস্ট্রেট আদালত',
            'Chief Metropolitan Magistrate Court'      => 'চিফ মেট্রোপলিটন ম্যাজিস্ট্রেট আদালত',
            'Metropolitan Magistrate Court'            => 'মেট্রোপলিটন ম্যাজিস্ট্রেট আদালত',
            'Family Court'                             => 'পারিবারিক আদালত',
            'Labour Court'                             => 'শ্রম আদালত',
            'Nari O Shishu Nirjatan Daman Tribunal'    => 'নারী ও শিশু নির্যাতন দমন ট্রাইব্যুনাল',
            'Money Loan Court (Artha Rin Adalat)'      => 'অর্থ ঋণ আদালত',
            'Bankruptcy Court'                         => 'দেউলিয়া আদালত',
            'Special Tribunal'                         => 'বিশেষ ট্রাইব্যুনাল',
            'Cyber Tribunal'                           => 'সাইবার ট্রাইব্যুনাল',
            'Environment Court'                        => 'পরিবেশ আদালত',
            'Juvenile Court'                           => 'কিশোর আদালত',
            'Tax Appellate Tribunal'                   => 'কর আপিল ট্রাইব্যুনাল',
            'Land Survey Tribunal'                     => 'ভূমি জরিপ ট্রাইব্যুনাল',
            'Administrative Tribunal'                  => 'প্রশাসনিক ট্রাইব্যুনাল',
        ];

        // Rename old seeder court types to full official names
        $renames = [
            'District and Sessions Court' => 'District and Sessions Judge Court',
            'Additional District and Sessions Court' => 'Additional District and Sessions Judge Court',
            'Joint District and Sessions Court' => 'Joint District and Sessions Judge Court',
            'Tribunal' => null, // will be superseded by specific tribunal types
        ];

        foreach ($renames as $oldName => $newName) {
            $existing = CourtType::query()
                ->where('country_id', $countryId)
                ->where('name', $oldName)
                ->first();

            if ($existing && $newName !== null) {
                $existing->update(['name' => $newName]);
            }
        }

        $typeModels = [];
        foreach ($courtTypes as $en => $bn) {
            $typeModels[$en] = CourtType::query()->firstOrCreate(
                ['country_id' => $countryId, 'name' => $en],
                ['name_bn' => $bn]
            );
            // Ensure name_bn is up to date
            if ($typeModels[$en]->name_bn !== $bn) {
                $typeModels[$en]->update(['name_bn' => $bn]);
            }
        }

        // ─── Metropolitan districts (have CMM instead of CJM) ───────
        $metropolitanDistricts = ['Dhaka', 'Chattogram', 'Rajshahi', 'Khulna', 'Sylhet', 'Rangpur'];

        // ─── Standard court set per district ────────────────────────
        // Every district gets these courts. Metropolitan districts get CMM courts instead of CJM.
        $standardCourts = [
            'District and Sessions Judge Court',
            'Additional District and Sessions Judge Court',
            'Joint District and Sessions Judge Court',
            'Senior Assistant Judge Court',
            'Assistant Judge Court',
            'Family Court',
            'Nari O Shishu Nirjatan Daman Tribunal',
        ];

        $cjmCourts = [
            'Chief Judicial Magistrate Court',
            'Judicial Magistrate Court',
        ];

        $cmmCourts = [
            'Chief Metropolitan Magistrate Court',
            'Metropolitan Magistrate Court',
        ];

        // Courts that only exist in divisional HQs or major districts
        $divisionalCourts = [
            'Labour Court',
            'Money Loan Court (Artha Rin Adalat)',
            'Environment Court',
            'Juvenile Court',
        ];

        // Divisional HQ district names
        $divisionalHQs = ['Barishal', 'Chattogram', 'Dhaka', 'Khulna', 'Mymensingh', 'Rajshahi', 'Rangpur', 'Sylhet'];

        // ─── Generate courts ────────────────────────────────────────
        $courtCount = 0;

        foreach ($districtModels as $districtName => $district) {
            $division = null;
            foreach ($districts as $divName => $dList) {
                if (array_key_exists($districtName, $dList)) {
                    $division = $divisionModels[$divName];
                    break;
                }
            }

            if (! $division) {
                continue;
            }

            $isMetropolitan = in_array($districtName, $metropolitanDistricts, true);
            $isDivisionalHQ = in_array($districtName, $divisionalHQs, true);

            // Standard courts for every district
            foreach ($standardCourts as $typeName) {
                $this->createCourt($countryId, $division, $district, $typeModels[$typeName], $districtName);
                $courtCount++;
            }

            // CJM or CMM courts
            $magistrateCourts = $isMetropolitan ? $cmmCourts : $cjmCourts;
            foreach ($magistrateCourts as $typeName) {
                $this->createCourt($countryId, $division, $district, $typeModels[$typeName], $districtName);
                $courtCount++;
            }

            // Divisional HQ courts
            if ($isDivisionalHQ) {
                foreach ($divisionalCourts as $typeName) {
                    $this->createCourt($countryId, $division, $district, $typeModels[$typeName], $districtName);
                    $courtCount++;
                }
            }
        }

        // ─── Supreme Court (one-off, no district) ──────────────────
        $dhakaDivision = $divisionModels['Dhaka'];
        $dhakaDistrict = $districtModels['Dhaka'];

        Court::query()->firstOrCreate(
            ['country_id' => $countryId, 'name' => 'Supreme Court of Bangladesh (Appellate Division)'],
            [
                'name_bn' => 'বাংলাদেশ সুপ্রিম কোর্ট (আপিল বিভাগ)',
                'division_id' => $dhakaDivision->id,
                'district_id' => $dhakaDistrict->id,
                'court_type_id' => $typeModels['Supreme Court (Appellate Division)']->id,
                'is_active' => true,
            ]
        );

        Court::query()->firstOrCreate(
            ['country_id' => $countryId, 'name' => 'Supreme Court of Bangladesh (High Court Division)'],
            [
                'name_bn' => 'বাংলাদেশ সুপ্রিম কোর্ট (হাইকোর্ট বিভাগ)',
                'division_id' => $dhakaDivision->id,
                'district_id' => $dhakaDistrict->id,
                'court_type_id' => $typeModels['Supreme Court (High Court Division)']->id,
                'is_active' => true,
            ]
        );

        // High Court permanent bench in Chattogram, circuit benches elsewhere
        $hcBenches = [
            'Chattogram' => ['High Court Bench, Chattogram', 'হাইকোর্ট বেঞ্চ, চট্টগ্রাম'],
            'Rajshahi'   => ['High Court Circuit Bench, Rajshahi', 'হাইকোর্ট সার্কিট বেঞ্চ, রাজশাহী'],
            'Rangpur'    => ['High Court Circuit Bench, Rangpur', 'হাইকোর্ট সার্কিট বেঞ্চ, রংপুর'],
            'Sylhet'     => ['High Court Circuit Bench, Sylhet', 'হাইকোর্ট সার্কিট বেঞ্চ, সিলেট'],
            'Barishal'   => ['High Court Circuit Bench, Barishal', 'হাইকোর্ট সার্কিট বেঞ্চ, বরিশাল'],
        ];

        foreach ($hcBenches as $districtName => [$en, $bn]) {
            Court::query()->firstOrCreate(
                ['country_id' => $countryId, 'name' => $en],
                [
                    'name_bn' => $bn,
                    'division_id' => $divisionModels[$districtName]->id,
                    'district_id' => $districtModels[$districtName]->id,
                    'court_type_id' => $typeModels['Supreme Court (High Court Division)']->id,
                    'is_active' => true,
                ]
            );
        }

        // National-level special tribunals (Dhaka)
        $nationalTribunals = [
            ['Special Tribunal, Dhaka', 'বিশেষ ট্রাইব্যুনাল, ঢাকা', 'Special Tribunal'],
            ['Cyber Tribunal, Dhaka', 'সাইবার ট্রাইব্যুনাল, ঢাকা', 'Cyber Tribunal'],
            ['Tax Appellate Tribunal, Dhaka', 'কর আপিল ট্রাইব্যুনাল, ঢাকা', 'Tax Appellate Tribunal'],
            ['Land Survey Tribunal, Dhaka', 'ভূমি জরিপ ট্রাইব্যুনাল, ঢাকা', 'Land Survey Tribunal'],
            ['Administrative Tribunal, Dhaka', 'প্রশাসনিক ট্রাইব্যুনাল, ঢাকা', 'Administrative Tribunal'],
            ['Bankruptcy Court, Dhaka', 'দেউলিয়া আদালত, ঢাকা', 'Bankruptcy Court'],
        ];

        foreach ($nationalTribunals as [$en, $bn, $typeName]) {
            Court::query()->firstOrCreate(
                ['country_id' => $countryId, 'name' => $en],
                [
                    'name_bn' => $bn,
                    'division_id' => $dhakaDivision->id,
                    'district_id' => $dhakaDistrict->id,
                    'court_type_id' => $typeModels[$typeName]->id,
                    'is_active' => true,
                ]
            );
        }

        $courtCount += 2 + count($hcBenches) + count($nationalTribunals);

        $this->command->info("Seeded: {$this->countOf($divisionModels)} divisions, {$this->countOf($districtModels)} districts, {$this->countOf($typeModels)} court types, {$courtCount} courts.");
    }

    private function createCourt(
        int $countryId,
        CourtDivision $division,
        CourtDistrict $district,
        CourtType $type,
        string $districtName
    ): void {
        $en = "{$type->name}, {$districtName}";
        $bn = "{$type->name_bn}, {$district->name_bn}";

        Court::query()->firstOrCreate(
            ['country_id' => $countryId, 'name' => $en],
            [
                'name_bn' => $bn,
                'division_id' => $division->id,
                'district_id' => $district->id,
                'court_type_id' => $type->id,
                'is_active' => true,
            ]
        );
    }

    private function countOf(array $models): int
    {
        return count($models);
    }
}
