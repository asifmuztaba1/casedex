<?php

namespace App\Domain\Cases\Models;

use App\Domain\Cases\Enums\CaseStatus;
use App\Domain\Clients\Models\Client;
use App\Domain\Diary\Models\DiaryEntry;
use App\Domain\Documents\Models\Document;
use App\Domain\Hearings\Models\Hearing;
use App\Models\Concerns\BelongsToTenant;
use App\Models\User;
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
        'court',
        'case_number',
        'client_id',
        'story',
        'petition_draft',
        'created_by',
        'status',
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

    public function client()
    {
        return $this->belongsTo(Client::class, 'client_id');
    }

    public function participants()
    {
        return $this->hasMany(CaseParticipant::class, 'case_id');
    }

    public function hearings()
    {
        return $this->hasMany(Hearing::class, 'case_id');
    }

    public function diaryEntries()
    {
        return $this->hasMany(DiaryEntry::class, 'case_id');
    }

    public function documents()
    {
        return $this->hasMany(Document::class, 'case_id');
    }

    public function upcomingHearings()
    {
        return $this->hearings()
            ->where('hearing_at', '>=', now())
            ->orderBy('hearing_at');
    }

    public function recentDiaryEntries()
    {
        return $this->diaryEntries()
            ->orderByDesc('entry_at')
            ->limit(5);
    }

    public function recentDocuments()
    {
        return $this->documents()
            ->orderByDesc('created_at')
            ->limit(5);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
