<?php

namespace App\Domain\Cases\Models;

use App\Domain\Cases\Enums\PartyRole;
use App\Domain\Cases\Enums\PartySide;
use App\Domain\Cases\Enums\PartyType;
use App\Domain\Clients\Models\Client;
use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class CaseParty extends Model
{
    use HasFactory, SoftDeletes, BelongsToTenant;

    protected $fillable = [
        'case_id',
        'client_id',
        'type',
        'name',
        'side',
        'role',
        'is_client',
        'phone',
        'email',
        'address',
        'identity_number',
        'notes',
    ];

    protected $casts = [
        'type' => PartyType::class,
        'side' => PartySide::class,
        'role' => PartyRole::class,
        'is_client' => 'boolean',
    ];

    public function case()
    {
        return $this->belongsTo(CaseFile::class, 'case_id');
    }

    public function client()
    {
        return $this->belongsTo(Client::class);
    }
}
