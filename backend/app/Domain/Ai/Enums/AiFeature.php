<?php

namespace App\Domain\Ai\Enums;

enum AiFeature: string
{
    case HearingSummary = 'hearing_summary';
    case DiarySummary = 'diary_summary';
    case ResearchSummary = 'research_summary';
    case DocumentQa = 'document_qa';
    case PetitionDraft = 'petition_draft';
    case LegalSectionLookup = 'legal_section_lookup';
    case CaseLawSuggestion = 'case_law_suggestion';
    case NextSteps = 'next_steps';
    case ClientCommunication = 'client_communication';
}
