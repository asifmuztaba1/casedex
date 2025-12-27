<?php

namespace App\Domain\Cases\Enums;

enum PartyType: string
{
    case Person = 'person';
    case Organization = 'organization';
}
