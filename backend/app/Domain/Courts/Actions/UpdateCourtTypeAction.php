<?php

namespace App\Domain\Courts\Actions;

use App\Domain\Courts\Models\CourtType;

class UpdateCourtTypeAction
{
    /**
     * @param  array<string, mixed>  $data
     */
    public function handle(CourtType $type, array $data): CourtType
    {
        $type->fill([
            'name' => $data['name'],
            'name_bn' => $data['name_bn'],
        ]);
        $type->save();

        return $type;
    }
}
