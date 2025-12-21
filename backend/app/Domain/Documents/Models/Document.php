<?php

namespace App\Domain\Documents\Models;

use App\Domain\Documents\Enums\DocumentType;
use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Document extends Model
{
    use HasFactory, SoftDeletes, BelongsToTenant;

    protected $fillable = [
        'public_id',
        'tenant_id',
        'case_id',
        'document_type',
        'title',
        'file_path',
        'metadata',
    ];

    protected $casts = [
        'document_type' => DocumentType::class,
        'metadata' => 'array',
    ];

    protected static function booted(): void
    {
        static::creating(function (self $document): void {
            if ($document->public_id === null) {
                $document->public_id = (string) Str::ulid();
            }
        });
    }
}
