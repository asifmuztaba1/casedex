<?php

namespace App\Domain\Courts\Actions;

use App\Domain\Courts\Models\CourtDivision;

class CreateCourtDivisionAction
{
    /**
     * @param  array<string, mixed>  $data
     */
    public function handle(array $data): CourtDivision
    {
        return CourtDivision::create([
            'country_id' => $data['country_id'],
            'name' => $data['name'],
            'name_bn' => $data['name_bn'],
        ]);
    }
}
