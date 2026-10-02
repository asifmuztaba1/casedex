<?php

namespace App\Models\Concerns;

use Illuminate\Support\Str;

/**
 * Gives a model a ULID `public_id`, the only identifier the API exposes.
 */
trait HasPublicId
{
    public static function bootHasPublicId(): void
    {
        static::creating(function ($model): void {
            if ($model->public_id === null) {
                $model->public_id = (string) Str::ulid();
            }
        });
    }
}
