<?php

namespace App\Models\Concerns;

use App\Support\TenantContext;
use Illuminate\Database\Eloquent\Builder;

trait BelongsToTenant
{
    protected static function bootBelongsToTenant(): void
    {
        static::addGlobalScope('tenant', function (Builder $builder): void {
            $builder->where($builder->getModel()->getTable().'.tenant_id', TenantContext::id());
        });

        static::creating(function ($model): void {
            if ($model->tenant_id === null) {
                $model->tenant_id = TenantContext::id();
            }
        });
    }
}
