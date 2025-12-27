<?php

namespace App\Domain\Courts\Models;

use App\Domain\Tenancy\Models\Country;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Court extends Model
{
    use HasFactory;

    protected $fillable = [
        'public_id',
        'country_id',
        'division_id',
        'district_id',
        'court_type_id',
        'name',
        'name_bn',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    protected static function booted(): void
    {
        static::creating(function (self $court): void {
            if ($court->public_id === null) {
                $court->public_id = (string) Str::ulid();
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

    public function district()
    {
        return $this->belongsTo(CourtDistrict::class, 'district_id');
    }

    public function type()
    {
        return $this->belongsTo(CourtType::class, 'court_type_id');
    }

    public function displayName(string $locale): string
    {
        if ($locale === 'bn' && $this->name_bn) {
            return $this->name_bn;
        }

        return $this->name;
    }
}
