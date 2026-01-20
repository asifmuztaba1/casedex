<?php

namespace App\Domain\Tenancy\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Country extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'code',
        'active',
    ];

    protected $casts = [
        'active' => 'boolean',
    ];
}
