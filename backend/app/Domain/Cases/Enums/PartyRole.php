<?php

namespace App\Domain\Cases\Enums;

enum PartyRole: string
{
    case Petitioner = 'petitioner';
    case Respondent = 'respondent';
    case Appellant = 'appellant';
    case Defendant = 'defendant';
    case Claimant = 'claimant';
    case Plaintiff = 'plaintiff';
    case Applicant = 'applicant';
    case Accused = 'accused';
    case State = 'state';
    case Other = 'other';
}
