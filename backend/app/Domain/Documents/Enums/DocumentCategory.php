<?php

namespace App\Domain\Documents\Enums;

enum DocumentCategory: string
{
    case Petition = 'petition';
    case Evidence = 'evidence';
    case OrderSheet = 'order_sheet';
    case ClientId = 'client_id';
    case Notes = 'notes';
    case Other = 'other';
}
