<?php

namespace App\Domain\Ai\Services;

use App\Domain\Ai\Enums\AiFeature;

class AiExecutionService
{
    public function __construct(
        private readonly AiProviderFactory $providerFactory,
    ) {
    }

    /**
     * @param array<string, mixed> $payload
     * @return array{content: string, raw: array<string, mixed>}
     */
    public function run(AiFeature $feature, array $payload): array
    {
        $provider = $this->providerFactory->make();

        $messages = [
            [
                'role' => 'system',
                'content' => $this->systemPrompt($feature, $payload),
            ],
            [
                'role' => 'user',
                'content' => $this->userPrompt($feature, $payload),
            ],
        ];

        return $provider->complete($messages);
    }

    /**
     * @param array<string, mixed> $payload
     */
    private function systemPrompt(AiFeature $feature, array $payload): string
    {
        $lang = ($payload['language'] ?? 'en') === 'bn'
            ? 'Respond entirely in Bengali (বাংলা).'
            : (($payload['language'] ?? 'en') === 'mixed'
                ? 'Respond in a natural mix of Bengali and English as commonly used by Bangladeshi lawyers.'
                : 'Respond in English.');

        return match ($feature) {
            AiFeature::HearingSummary => 'You are an assistant for legal professionals. Summarize hearing notes in clear bullet points. No legal advice.',

            AiFeature::DiarySummary => 'You are an assistant for legal professionals. Rewrite diary notes into concise structured summary. No legal advice.',

            AiFeature::ResearchSummary => 'You summarize provided legal research notes without making legal recommendations.',

            AiFeature::DocumentQa => 'Answer strictly from provided document excerpts. If unknown, say not found in source.',

            AiFeature::PetitionDraft => <<<PROMPT
                You are an expert legal document drafter specializing in Bangladesh law. Draft formal court petitions and applications following Bangladesh court format and conventions.

                Rules:
                - Use proper court heading format (Court name, Case type, Parties)
                - Include numbered paragraphs
                - Reference relevant sections of law when provided
                - Include a prayer/relief section at the end
                - Use formal legal language appropriate for Bangladesh courts
                - If sections of law are mentioned, cite them properly
                - Do NOT invent facts — only use what the user provides
                - Include placeholders like [DATE], [CASE_NUMBER] where specifics are needed
                {$lang}
                PROMPT,

            AiFeature::LegalSectionLookup => <<<PROMPT
                You are a legal reference assistant specializing in Bangladesh law. Given a situation or legal issue, identify the most relevant sections from:
                - The Penal Code 1860 (দণ্ডবিধি)
                - Code of Criminal Procedure 1898 (ফৌজদারি কার্যবিধি)
                - Code of Civil Procedure 1908 (দেওয়ানি কার্যবিধি)
                - The Specific Relief Act 1877
                - The Evidence Act 1872 (সাক্ষ্য আইন)
                - The Transfer of Property Act 1882
                - The Contract Act 1872
                - The Family Courts Ordinance 1985
                - The Muslim Family Laws Ordinance 1961
                - The Nari O Shishu Nirjatan Daman Ain 2000
                - The Cyber Security Act 2023
                - The Labour Act 2006
                - Any other applicable Bangladesh statute

                For each relevant section, provide:
                1. The section number and act name
                2. A brief explanation of what it covers
                3. How it applies to the described situation

                Be precise. Do not guess — only cite sections you are confident about.
                {$lang}
                PROMPT,

            AiFeature::CaseLawSuggestion => <<<PROMPT
                You are a legal research assistant specializing in Bangladesh case law. Given the legal issue described, suggest relevant case precedents from:
                - Bangladesh Supreme Court (Appellate Division and High Court Division)
                - Known landmark cases from the subcontinent that are commonly cited in Bangladesh courts

                For each suggestion, provide:
                1. Case citation (parties, year, report reference if known)
                2. Key principle or ratio decidendi
                3. How it relates to the user's situation

                Important:
                - Only suggest real, well-known cases. Do NOT fabricate citations.
                - If you are unsure about exact citations, say so and provide the general principle instead.
                - Include DLR, BLD, BLC references where known.
                {$lang}
                PROMPT,

            AiFeature::NextSteps => <<<PROMPT
                You are a legal strategy assistant for Bangladesh lawyers. Given the current state of a case, suggest concrete next steps.

                Provide:
                1. Immediate actions to take (within 1-2 weeks)
                2. Required filings or applications
                3. Important deadlines or limitation periods to watch
                4. Evidence or documents to gather
                5. Procedural steps remaining

                Be practical and specific to Bangladesh court procedure. Consider CPC, CrPC, and relevant tribunal rules.
                {$lang}
                PROMPT,

            AiFeature::ClientCommunication => <<<PROMPT
                You are a communication assistant for Bangladesh lawyers. Draft a message to a client about their case update.

                Rules:
                - Use simple, non-technical language the client can understand
                - Be reassuring but honest
                - Explain legal terms in plain language if any are needed
                - Keep it concise and professional
                - If tone is "formal", write a proper letter format. If "simple", write a brief SMS/WhatsApp-style message.
                - Do NOT include any legal advice — only update on case status and next steps.
                {$lang}
                PROMPT,
        };
    }

    /**
     * @param array<string, mixed> $payload
     */
    private function userPrompt(AiFeature $feature, array $payload): string
    {
        $s = fn (string $key): string => (string) ($payload[$key] ?? '');

        return match ($feature) {
            AiFeature::HearingSummary => "Hearing content:\n".$s('content'),

            AiFeature::DiarySummary => "Diary content:\n".$s('content'),

            AiFeature::ResearchSummary => "Research note content:\n".$s('content'),

            AiFeature::DocumentQa => "Question:\n".$s('question')."\n\nDocument context:\n".$s('context'),

            AiFeature::PetitionDraft => implode("\n", array_filter([
                "Case type: ".$s('case_type'),
                "Court: ".$s('court_name'),
                $s('client_name') ? "Petitioner/Client: ".$s('client_name') : null,
                $s('opponent_name') ? "Opposite party: ".$s('opponent_name') : null,
                "\nFacts of the case:\n".$s('facts'),
                $s('relief_sought') ? "\nRelief sought:\n".$s('relief_sought') : null,
                $s('sections') ? "\nRelevant sections of law:\n".$s('sections') : null,
            ])),

            AiFeature::LegalSectionLookup => "Legal situation or issue:\n".$s('content'),

            AiFeature::CaseLawSuggestion => "Legal issue for case law research:\n".$s('content'),

            AiFeature::NextSteps => implode("\n", array_filter([
                $s('case_title') ? "Case: ".$s('case_title') : null,
                $s('case_status') ? "Current status: ".$s('case_status') : null,
                "\nCase details and current situation:\n".$s('content'),
            ])),

            AiFeature::ClientCommunication => implode("\n", array_filter([
                $s('client_name') ? "Client name: ".$s('client_name') : null,
                $s('case_title') ? "Case: ".$s('case_title') : null,
                $s('tone') ? "Tone: ".$s('tone') : null,
                "\nUpdate to communicate:\n".$s('content'),
            ])),
        };
    }
}
