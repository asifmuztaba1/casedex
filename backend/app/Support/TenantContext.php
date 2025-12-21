<?php

namespace App\Support;

final class TenantContext
{
    private static ?int $tenantId = null;

    public static function set(int $tenantId): void
    {
        self::$tenantId = $tenantId;
    }

    public static function id(): int
    {
        if (self::$tenantId === null) {
            throw new \RuntimeException('Tenant context is not set.');
        }

        return self::$tenantId;
    }

    public static function clear(): void
    {
        self::$tenantId = null;
    }
}
