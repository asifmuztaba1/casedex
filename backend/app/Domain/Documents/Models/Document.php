<?php

namespace App\Domain\Documents\Models;

use App\Domain\Cases\Models\CaseFile;
use App\Domain\Documents\Enums\DocumentCategory;
use App\Domain\Hearings\Models\Hearing;
use App\Models\Concerns\BelongsToTenant;
use App\Models\User;
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
        'hearing_id',
        'category',
        'original_name',
        'mime',
        'size',
        'storage_key',
        'uploaded_by',
    ];

    protected $casts = [
        'category' => DocumentCategory::class,
    ];

    protected static function booted(): void
    {
        static::creating(function (self $document): void {
            if ($document->public_id === null) {
                $document->public_id = (string) Str::ulid();
            }
        });
    }

    public function case()
    {
        return $this->belongsTo(CaseFile::class, 'case_id');
    }

    public function hearing()
    {
        return $this->belongsTo(Hearing::class, 'hearing_id');
    }

    public function uploader()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}
