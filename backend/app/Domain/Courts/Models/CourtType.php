<?php

namespace App\Domain\Courts\Models;

use App\Domain\Tenancy\Models\Country;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class CourtType extends Model
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
        static::creating(function (self $type): void {
            if ($type->public_id === null) {
                $type->public_id = (string) Str::ulid();
            }
        });
    }

    public function country()
    {
        return $this->belongsTo(Country::class);
    }

    public function courts()
    {
        return $this->hasMany(Court::class, 'court_type_id');
    }
}
