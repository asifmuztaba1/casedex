<?php

namespace App\Domain\Documents\Enums;

enum DocumentType: string
{
    case Pleading = 'pleading';
    case Order = 'order';
    case Evidence = 'evidence';
    case Correspondence = 'correspondence';
    case Other = 'other';
}
