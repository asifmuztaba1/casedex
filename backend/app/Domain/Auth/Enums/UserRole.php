<?php

namespace App\Domain\Auth\Enums;

enum UserRole: string
{
    case PlatformAdmin = 'platform_admin';
    case PlatformEditor = 'platform_editor';
    case Admin = 'admin';
    case Lawyer = 'lawyer';
    case Associate = 'associate';
    case Assistant = 'assistant';
    case Viewer = 'viewer';

    public static function tenantRoles(): array
    {
        return [
            self::Admin->value,
            self::Lawyer->value,
            self::Associate->value,
            self::Assistant->value,
            self::Viewer->value,
        ];
    }

    public static function platformRoles(): array
    {
        return [
            self::PlatformAdmin->value,
            self::PlatformEditor->value,
        ];
    }

    public static function allValues(): array
    {
        return array_column(self::cases(), 'value');
    }
}
