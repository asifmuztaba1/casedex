<?php

namespace App\Domain\Voice\Services;

use App\Domain\Ai\Services\AiExecutionService;

/**
 * What the voice junior associate is and may do, kept in code so it is
 * reviewed like everything else and pushed to ElevenLabs from Admin → Voice
 * (SyncAssociateAgentAction). AGENTS.md §11 applies in full.
 *
 * Tools run in the lawyer's own browser against the normal CaseDex API, so
 * the associate only ever sees that lawyer's workspace. Tools that change
 * anything only create drafts the lawyer confirms on screen.
 */
final class AssociateAgentDefinition
{
    public const NAME = 'CaseDex junior associate';

    public static function prompt(): string
    {
        $guardrails = AiExecutionService::GUARDRAILS;

        return <<<PROMPT
            You are the CaseDex junior associate: a calm, efficient voice assistant for {{user_name}}, a lawyer at {{firm_name}} in Bangladesh. Today is {{today}}.
            Speak in the language the lawyer uses (Bangla, English, or a natural mix), briefly, like a junior colleague giving a quick update.

            What you do:
            - Answer questions about the lawyer's own cases and hearings using the tools. Never guess case facts; look them up.
            - Brief the lawyer on a case or on the day's hearings in a few sentences.
            - When the lawyer dictates an update, prepare a DRAFT with draft_diary_entry or draft_hearing_update and say it is on screen to check and confirm. You cannot save anything yourself; never say something was saved.
            - Suggest statutory sections, case law or procedural next steps only as leads to verify, and say so.

            {$guardrails}
            - If a tool finds nothing, say so plainly. If several cases match, ask which one.
            - Keep personal data you hear out of your answers unless the lawyer asks for it.
            PROMPT;
    }

    public static function firstMessage(): string
    {
        return '{{greeting}}';
    }

    /**
     * Client tools, implemented in the browser (frontend/features/voice/associate-tools.ts).
     *
     * @return array<int, array<string, mixed>>
     */
    public static function tools(): array
    {
        $tool = fn (string $name, string $description, array $properties = [], array $required = []): array => [
            'type' => 'client',
            'name' => $name,
            'description' => $description,
            'expects_response' => true,
            'response_timeout_secs' => 20,
            'parameters' => ['type' => 'object', 'properties' => (object) $properties, 'required' => $required],
        ];
        $string = fn (string $description): array => ['type' => 'string', 'description' => $description];

        return [
            $tool('get_hearings', 'List the lawyer\'s hearings for today, tomorrow or the next 7 days, with court, time and case.', [
                'range' => ['type' => 'string', 'enum' => ['today', 'tomorrow', 'week'], 'description' => 'Which days to list.'],
            ], ['range']),
            $tool('find_cases', 'Find the lawyer\'s cases by party name, title, case number or court.', [
                'query' => $string('Words to search for, e.g. a party name.'),
            ], ['query']),
            $tool('get_case_brief', 'Get a short brief of one case: parties, court, status, next hearing, recent diary entries and documents.', [
                'case_public_id' => $string('The case id returned by find_cases or get_hearings.'),
            ], ['case_public_id']),
            $tool('draft_diary_entry', 'Prepare a diary entry for the lawyer to confirm on screen. Does not save it.', [
                'case_public_id' => $string('The case id.'),
                'title' => $string('A short title.'),
                'body' => $string('The note, in the lawyer\'s words.'),
            ], ['case_public_id', 'title', 'body']),
            $tool('draft_hearing_update', 'Prepare a hearing update (outcome, minutes, next date) for the lawyer to confirm on screen. Does not save it.', [
                'case_public_id' => $string('The case id.'),
                'hearing_public_id' => $string('The hearing being updated, if known.'),
                'outcome' => $string('What happened, in the lawyer\'s words.'),
                'minutes' => $string('Longer notes, if any.'),
                'next_hearing_at' => $string('Next hearing date and time as YYYY-MM-DDTHH:MM (Bangladesh time), if given.'),
            ], ['case_public_id']),
            $tool('open_case', 'Open a case on the lawyer\'s screen.', [
                'case_public_id' => $string('The case id.'),
            ], ['case_public_id']),
        ];
    }

    /**
     * @param  array<int, string>  $toolIds
     * @return array<string, mixed>
     */
    public static function agentConfig(array $toolIds): array
    {
        return [
            'name' => self::NAME,
            'conversation_config' => [
                'agent' => [
                    'first_message' => self::firstMessage(),
                    'language' => 'bn',
                    'prompt' => [
                        'prompt' => self::prompt(),
                        'llm' => config('services.elevenlabs.associate_llm'),
                        'temperature' => 0.2,
                        'tool_ids' => $toolIds,
                    ],
                ],
                'tts' => [
                    'voice_id' => config('services.elevenlabs.associate_voice_id'),
                ],
                'conversation' => [
                    'max_duration_seconds' => (int) config('services.elevenlabs.associate_max_seconds', 600),
                    'client_events' => ['user_transcript', 'agent_response', 'client_tool_call', 'interruption'],
                ],
            ],
            'platform_settings' => [
                // Only sessions started through CaseDex (server-issued tokens).
                'auth' => ['enable_auth' => true],
            ],
        ];
    }
}
