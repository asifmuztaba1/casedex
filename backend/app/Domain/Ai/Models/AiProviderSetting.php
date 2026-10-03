<?php

namespace App\Domain\Ai\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Platform-wide AI provider settings (not tenant data). The API key is
 * encrypted at rest and never leaves the server.
 */
class AiProviderSetting extends Model
{
    protected $table = 'ai_providers';

    protected $fillable = ['provider', 'model', 'base_url', 'api_key', 'is_active', 'updated_by', 'last_tested_at', 'last_test_ok'];

    protected $hidden = ['api_key'];

    protected $casts = [
        'api_key' => 'encrypted',
        'is_active' => 'boolean',
        'last_tested_at' => 'datetime',
        'last_test_ok' => 'boolean',
    ];

    public function editor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
}
