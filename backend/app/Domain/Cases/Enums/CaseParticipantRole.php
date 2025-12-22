<?php

namespace App\Domain\Cases\Enums;

enum CaseParticipantRole: string
{
    case LeadLawyer = 'lead_lawyer';
    case Lawyer = 'lawyer';
    case Associate = 'associate';
    case Assistant = 'assistant';
    case Viewer = 'viewer';
}
