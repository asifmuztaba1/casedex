<?php

namespace App\Domain\Hearings\Models;

use App\Domain\Hearings\Enums\HearingType;
use App\Domain\Cases\Models\CaseFile;
use App\Domain\Diary\Models\DiaryEntry;
use App\Domain\Documents\Models\Document;
use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Hearing extends Model
{
    use HasFactory, SoftDeletes, BelongsToTenant;

    protected $fillable = [
        'public_id',
        'tenant_id',
        'case_id',
        'hearing_at',
        'type',
        'agenda',
        'location',
        'outcome',
        'minutes',
        'next_steps',
    ];

    protected $casts = [
        'hearing_at' => 'datetime',
        'type' => HearingType::class,
    ];

    protected static function booted(): void
    {
        static::creating(function (self $hearing): void {
            if ($hearing->public_id === null) {
                $hearing->public_id = (string) Str::ulid();
            }
        });
    }

    public function case()
    {
        return $this->belongsTo(CaseFile::class, 'case_id');
    }

    public function diaryEntries()
    {
        return $this->hasMany(DiaryEntry::class, 'hearing_id');
    }

    public function documents()
    {
        return $this->hasMany(Document::class, 'hearing_id');
    }
}
