<?php

namespace App\Domain\Diary\Models;

use App\Domain\Cases\Models\CaseFile;
use App\Domain\Hearings\Models\Hearing;
use App\Models\Concerns\BelongsToTenant;
use App\Models\User;
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
        'hearing_id',
        'entry_at',
        'title',
        'body',
        'created_by',
    ];

    protected $casts = [
        'entry_at' => 'datetime',
    ];

    protected static function booted(): void
    {
        static::creating(function (self $entry): void {
            if ($entry->public_id === null) {
                $entry->public_id = (string) Str::ulid();
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

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
