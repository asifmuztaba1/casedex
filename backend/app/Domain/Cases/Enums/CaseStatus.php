<?php

namespace App\Domain\Cases\Enums;

enum CaseStatus: string
{
    case Open = 'open';
    case Active = 'active';
    case Closed = 'closed';
    case Archived = 'archived';
}
