<?php

namespace App\Domain\Research\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class ResearchNote extends Model
{
    use HasFactory, SoftDeletes, BelongsToTenant;

    protected $fillable = [
        'public_id',
        'tenant_id',
        'title',
        'body',
    ];

    protected static function booted(): void
    {
        static::creating(function (self $note): void {
            if ($note->public_id === null) {
                $note->public_id = (string) Str::ulid();
            }
        });
    }
}
