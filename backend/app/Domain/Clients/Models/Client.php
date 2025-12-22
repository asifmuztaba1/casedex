<?php

namespace App\Domain\Clients\Models;

use App\Domain\Cases\Models\CaseFile;
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
    ];

    public function cases()
    {
        return $this->hasMany(CaseFile::class, 'client_id');
    }
}
