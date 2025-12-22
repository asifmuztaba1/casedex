<?php

namespace App\Domain\Auth\Enums;

enum UserRole: string
{
    case Admin = 'admin';
    case Lawyer = 'lawyer';
    case Associate = 'associate';
    case Assistant = 'assistant';
    case Viewer = 'viewer';
}
