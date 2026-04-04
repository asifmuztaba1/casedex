<?php

namespace App\Support;

final class TenantContext
{
    /**
     * @var array<int, int>
     */
    private static array $stack = [];

    public static function set(int $tenantId): void
    {
        self::$stack[] = $tenantId;
    }

    public static function id(): int
    {
        if (self::$stack === []) {
            throw new \RuntimeException('Tenant context is not set.');
        }

        return self::$stack[array_key_last(self::$stack)];
    }

    public static function clear(): void
    {
        array_pop(self::$stack);
    }
}
