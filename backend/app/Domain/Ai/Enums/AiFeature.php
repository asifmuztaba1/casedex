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

    // Voice (ElevenLabs): billed from the same AI credits, but not text prompts.
    case VoiceDictation = 'voice_dictation';
    case VoiceAssociate = 'voice_associate';

    public function isVoice(): bool
    {
        return $this === self::VoiceDictation || $this === self::VoiceAssociate;
    }

    /**
     * The features that run a text prompt through AiExecutionService.
     *
     * @return array<int, self>
     */
    public static function textFeatures(): array
    {
        return array_values(array_filter(self::cases(), fn (self $feature): bool => ! $feature->isVoice()));
    }
}
