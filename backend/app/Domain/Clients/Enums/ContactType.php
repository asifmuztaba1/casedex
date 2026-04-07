<?php

namespace App\Domain\Clients\Enums;

enum ContactType: string
{
    case Person = 'person';
    case Organization = 'organization';
}
