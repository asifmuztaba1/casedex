<?php

namespace App\Domain\Tenancy\Models;

use Database\Factories\TenantFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;
use App\Domain\Tenancy\Enums\TenantPlan;

class Tenant extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'public_id',
        'plan',
        'country_id',
        'locale',
    ];

    protected $casts = [
        'plan' => TenantPlan::class,
    ];

    public function country()
    {
        return $this->belongsTo(Country::class);
    }

    protected static function booted(): void
    {
        static::creating(function (self $tenant): void {
            if ($tenant->public_id === null) {
                $tenant->public_id = (string) Str::ulid();
            }
        });
    }

    protected static function newFactory(): TenantFactory
    {
        return TenantFactory::new();
    }
}
