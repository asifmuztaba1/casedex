<?php

namespace Database\Seeders;

use App\Domain\Tenancy\Models\Country;
use Illuminate\Database\Seeder;

class CountriesSeeder extends Seeder
{
    public function run(): void
    {
        $path = database_path('data/countries.json');
        $countries = json_decode((string) file_get_contents($path), true);

        foreach ($countries as $code => $name) {
            Country::updateOrCreate(
                ['code' => $code],
                ['name' => $name]
            );
        }
    }
}
