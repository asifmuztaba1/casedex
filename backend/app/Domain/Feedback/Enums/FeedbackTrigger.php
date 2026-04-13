<?php

namespace App\Domain\Feedback\Enums;

enum FeedbackTrigger: string
{
    case TrialReminder = 'trial_reminder';
    case FirstCase = 'first_case';
    case Manual = 'manual';
}
