<?php

namespace App\Domain\Platform\Models;

use Illuminate\Database\Eloquent\Model;

/** Platform-wide switches edited in the admin console (not tenant data). */
class PlatformSetting extends Model
{
    protected $fillable = ['key', 'value', 'updated_by'];

    protected $casts = ['value' => 'json'];
}
