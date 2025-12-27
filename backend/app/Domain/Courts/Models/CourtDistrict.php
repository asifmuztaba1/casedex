<?php

namespace App\Domain\Courts\Models;

use App\Domain\Tenancy\Models\Country;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class CourtDistrict extends Model
{
    use HasFactory;

    protected $fillable = [
        'public_id',
        'country_id',
        'division_id',
        'name',
        'name_bn',
    ];

    protected static function booted(): void
    {
        static::creating(function (self $district): void {
            if ($district->public_id === null) {
                $district->public_id = (string) Str::ulid();
            }
        });
    }

    public function country()
    {
        return $this->belongsTo(Country::class);
    }

    public function division()
    {
        return $this->belongsTo(CourtDivision::class, 'division_id');
    }

    public function courts()
    {
        return $this->hasMany(Court::class, 'district_id');
    }
}
