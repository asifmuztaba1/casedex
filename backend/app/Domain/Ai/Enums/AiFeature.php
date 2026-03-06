<?php

namespace App\Domain\Ai\Enums;

enum AiFeature: string
{
    case HearingSummary = 'hearing_summary';
    case DiarySummary = 'diary_summary';
    case ResearchSummary = 'research_summary';
    case DocumentQa = 'document_qa';
}
