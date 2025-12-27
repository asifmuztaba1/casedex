<?php

namespace App\Domain\Courts\Actions;

use App\Domain\Courts\Models\CourtType;

class CreateCourtTypeAction
{
    /**
     * @param  array<string, mixed>  $data
     */
    public function handle(array $data): CourtType
    {
        return CourtType::create([
            'country_id' => $data['country_id'],
            'name' => $data['name'],
            'name_bn' => $data['name_bn'],
        ]);
    }
}
