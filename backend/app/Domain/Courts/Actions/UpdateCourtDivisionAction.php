<?php

namespace App\Domain\Courts\Actions;

use App\Domain\Courts\Models\CourtDivision;

class UpdateCourtDivisionAction
{
    /**
     * @param  array<string, mixed>  $data
     */
    public function handle(CourtDivision $division, array $data): CourtDivision
    {
        $division->fill([
            'name' => $data['name'],
            'name_bn' => $data['name_bn'],
        ]);
        $division->save();

        return $division;
    }
}
