<?php

namespace App\Domain\Clients\Models;

use App\Domain\Cases\Models\CaseFile;
use App\Domain\Cases\Models\CaseParty;
use App\Domain\Clients\Enums\ContactType;
use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Client extends Model
{
    use HasFactory, SoftDeletes, BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'name',
        'phone',
        'email',
        'address',
        'identity_number',
        'notes',
        'type',
        'is_client',
    ];

    protected $casts = [
        'type' => ContactType::class,
        'is_client' => 'boolean',
    ];

    public function cases()
    {
        return $this->hasMany(CaseFile::class, 'client_id');
    }

    public function caseParties()
    {
        return $this->hasMany(CaseParty::class, 'client_id');
    }
}
