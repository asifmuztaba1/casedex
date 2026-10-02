<?php

namespace App\Domain\Cases\Models;

use App\Domain\Cases\Enums\CaseParticipantRole;
use App\Models\Concerns\BelongsToTenant;
use App\Models\Concerns\HasPublicId;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CaseParticipant extends Model
{
    use HasFactory, BelongsToTenant, HasPublicId;

    protected $fillable = [
        'public_id',
        'tenant_id',
        'case_id',
        'user_id',
        'role',
    ];

    protected $casts = [
        'role' => CaseParticipantRole::class,
    ];

    public function case()
    {
        return $this->belongsTo(CaseFile::class, 'case_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
