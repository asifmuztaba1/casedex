<?php

namespace App\Domain\Courts\Models;

use App\Domain\Tenancy\Models\Country;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class CourtDivision extends Model
{
    use HasFactory;

    protected $fillable = [
        'public_id',
        'country_id',
        'name',
        'name_bn',
    ];

    protected static function booted(): void
    {
        static::creating(function (self $division): void {
            if ($division->public_id === null) {
                $division->public_id = (string) Str::ulid();
            }
        });
    }

    public function country()
    {
        return $this->belongsTo(Country::class);
    }

    public function districts()
    {
        return $this->hasMany(CourtDistrict::class, 'division_id');
    }
}
