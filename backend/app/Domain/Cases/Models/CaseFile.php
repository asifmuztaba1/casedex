<?php

namespace App\Domain\Cases\Models;

use App\Domain\Cases\Enums\CaseStatus;
use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class CaseFile extends Model
{
    use HasFactory, SoftDeletes, BelongsToTenant;

    protected $table = 'cases';

    protected $fillable = [
        'public_id',
        'tenant_id',
        'title',
        'status',
        'reference',
        'summary',
    ];

    protected $casts = [
        'status' => CaseStatus::class,
    ];

    protected static function booted(): void
    {
        static::creating(function (self $case): void {
            if ($case->public_id === null) {
                $case->public_id = (string) Str::ulid();
            }
        });
    }
}
