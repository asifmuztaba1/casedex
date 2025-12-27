<?php

namespace Database\Seeders;

use App\Domain\Courts\Models\CourtType;
use App\Domain\Tenancy\Models\Country;
use Illuminate\Database\Seeder;

class CourtTypesSeeder extends Seeder
{
    public function run(): void
    {
        $countryId = Country::query()
            ->where('code', 'BD')
            ->value('id');

        if (! $countryId) {
            return;
        }

        $types = [
            ['name' => 'District and Sessions Court', 'name_bn' => 'জেলা ও দায়রা জজ আদালত'],
            ['name' => 'Additional District and Sessions Court', 'name_bn' => 'অতিরিক্ত জেলা ও দায়রা জজ আদালত'],
            ['name' => 'Joint District and Sessions Court', 'name_bn' => 'যৌথ জেলা ও দায়রা জজ আদালত'],
            ['name' => 'Chief Judicial Magistrate Court', 'name_bn' => 'চিফ জুডিশিয়াল ম্যাজিস্ট্রেট আদালত'],
            ['name' => 'Tribunal', 'name_bn' => 'ট্রাইব্যুনাল'],
        ];

        foreach ($types as $type) {
            CourtType::query()->firstOrCreate(
                ['country_id' => $countryId, 'name' => $type['name']],
                ['name_bn' => $type['name_bn']]
            );
        }
    }
}
