<?php

namespace App\Domain\Cases\Enums;

enum PartySide: string
{
    case Client = 'client';
    case Opponent = 'opponent';
    case ThirdParty = 'third_party';
}
