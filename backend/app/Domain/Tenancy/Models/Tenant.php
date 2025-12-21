<?php

namespace App\Domain\Tenancy\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Tenant extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'public_id',
    ];

    protected static function booted(): void
    {
        static::creating(function (self $tenant): void {
            if ($tenant->public_id === null) {
                $tenant->public_id = (string) Str::ulid();
            }
        });
    }
}
