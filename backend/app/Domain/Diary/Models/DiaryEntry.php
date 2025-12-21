<?php

namespace App\Domain\Diary\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class DiaryEntry extends Model
{
    use HasFactory, SoftDeletes, BelongsToTenant;

    protected $fillable = [
        'public_id',
        'tenant_id',
        'case_id',
        'entry_date',
        'content',
    ];

    protected $casts = [
        'entry_date' => 'date',
    ];

    protected static function booted(): void
    {
        static::creating(function (self $entry): void {
            if ($entry->public_id === null) {
                $entry->public_id = (string) Str::ulid();
            }
        });
    }
}
