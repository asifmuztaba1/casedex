<?php

namespace App\Domain\Hearings\Enums;

enum HearingType: string
{
    case Mention = 'mention';
    case Hearing = 'hearing';
    case Trial = 'trial';
    case Order = 'order';
}
