# CaseDex Agentic AI — Implementation Plan

## Overview

Three autonomous AI agents that work proactively for lawyers, built on top of the existing AI infrastructure (AiExecutionService, Horizon queues, credit system).

| Agent | Trigger | What It Does |
|-------|---------|--------------|
| **Daily Briefing** | Cron (7 AM daily) | Morning digest: today's hearings, deadlines, stale cases, action items |
| **Hearing Prep** | Cron (9 PM nightly) | Prep brief for tomorrow's hearings: case summary, arguments, documents to carry |
| **Case Intake** | User-initiated (chat) | Conversational case creation: asks questions, checks conflicts, creates case + client + parties + first hearing |

---

## Architecture

### Current Flow (Manual)

```
User clicks AI feature → 1 API call → 1 AI prompt → poll result
```

### Agentic Flow (Autonomous)

```
Trigger (cron/user) → AgentRun created → Steps execute sequentially:
  GatherStep  → collect data from DB (no credits)
  AiStep      → call LLM with assembled context (costs credits)
  CompileStep → format final output
  NotifyStep  → send notification (in-app + email)
```

### Key Design Decisions

1. **Reuse existing AiExecutionService** — agents compose prompts the same way, through the same provider abstraction (Groq/Gemini)
2. **Reuse existing credit system** — agent runs consume credits like any other AI feature, tracked in the same ledger
3. **Sequential steps, not parallel** — each step can use output from previous steps; keeps orchestration simple and debuggable
4. **Tenant-scoped** — agents run per-tenant, respecting data isolation
5. **Opt-in with sensible defaults** — users can enable/disable each agent and configure notification preferences
6. **Graceful degradation** — if credits run out mid-agent, partial results are saved and user is notified

---

## Phase 1: Agent Infrastructure

### 1.1 Migration — `agent_runs` table

```
agent_runs:
  id                  bigint PK
  public_id           ulid UNIQUE
  tenant_id           FK → tenants (CASCADE)
  user_id             FK → users (CASCADE, nullable)
  agent_type          string(30)        -- 'daily_briefing', 'hearing_prep', 'case_intake'
  status              string(30)        -- 'queued', 'running', 'completed', 'failed', 'partial'
  current_step        unsignedTinyInt   -- tracks progress
  total_steps         unsignedTinyInt
  input_payload       JSON              -- trigger context (e.g., hearing_id, user message)
  result_payload      JSON nullable     -- compiled output
  result_text         longText nullable -- human-readable result
  credits_consumed    unsignedInt default 0
  error_message       text nullable
  started_at          timestamp nullable
  completed_at        timestamp nullable
  failed_at           timestamp nullable
  created_at          timestamp
  updated_at          timestamp

  INDEX (tenant_id, agent_type, created_at)
  INDEX (status)
```

### 1.2 Migration — `agent_preferences` table

```
agent_preferences:
  id                  bigint PK
  tenant_id           FK → tenants (CASCADE)
  user_id             FK → users (CASCADE)
  agent_type          string(30)
  is_enabled          boolean default true
  notify_in_app       boolean default true
  notify_email        boolean default true
  config              JSON nullable     -- agent-specific settings (e.g., briefing_time: "07:00")
  created_at          timestamp
  updated_at          timestamp

  UNIQUE (user_id, agent_type)
```

### 1.3 Enum — `AgentType`

```php
enum AgentType: string
{
    case DailyBriefing = 'daily_briefing';
    case HearingPrep   = 'hearing_prep';
    case CaseIntake    = 'case_intake';
}
```

### 1.4 Enum — `AgentRunStatus`

```php
enum AgentRunStatus: string
{
    case Queued    = 'queued';
    case Running   = 'running';
    case Completed = 'completed';
    case Failed    = 'failed';
    case Partial   = 'partial';     // some steps succeeded, credits ran out
}
```

### 1.5 Model — `AgentRun`

```php
class AgentRun extends Model
{
    use HasUlid, BelongsToTenant, SoftDeletes;

    protected $casts = [
        'agent_type'     => AgentType::class,
        'status'         => AgentRunStatus::class,
        'input_payload'  => 'array',
        'result_payload' => 'array',
    ];

    // Relations
    public function user(): BelongsTo;
    public function tenant(): BelongsTo;
}
```

### 1.6 Model — `AgentPreference`

```php
class AgentPreference extends Model
{
    use BelongsToTenant;

    protected $casts = [
        'agent_type' => AgentType::class,
        'config'     => 'array',
    ];

    public function user(): BelongsTo;
}
```

### 1.7 Agent Interface

```php
interface AgentInterface
{
    public function type(): AgentType;
    public function creditCost(): int;
    public function steps(): array;           // returns Step[]
    public function compile(AgentContext $ctx): array; // returns [result_text, result_payload]
}
```

### 1.8 Step Types

```php
// Data gathering — no AI call, no credits
class GatherStep
{
    public function __construct(
        public readonly string $name,
        public readonly Closure $gather, // fn(AgentContext) => mixed
    ) {}
}

// AI call — uses AiExecutionService, costs credits
class AiStep
{
    public function __construct(
        public readonly string $name,
        public readonly Closure $buildMessages, // fn(AgentContext) => [system, user]
    ) {}
}

// Notification — sends result to user
class NotifyStep
{
    public function __construct(
        public readonly string $name,
        public readonly array $channels,    // ['in_app', 'email']
        public readonly string $notificationType,
    ) {}
}
```

### 1.9 AgentOrchestrator Service

```php
class AgentOrchestrator
{
    public function __construct(
        private AiExecutionService $aiService,
        private AiCreditService $creditService,
    ) {}

    public function run(AgentInterface $agent, User $user, array $input): AgentRun
    {
        $run = AgentRun::create([
            'tenant_id'     => $user->tenant_id,
            'user_id'       => $user->id,
            'agent_type'    => $agent->type(),
            'status'        => AgentRunStatus::Queued,
            'input_payload' => $input,
            'total_steps'   => count($agent->steps()),
            'current_step'  => 0,
        ]);

        $ctx = new AgentContext($user, $input, $run);
        $run->update(['status' => AgentRunStatus::Running, 'started_at' => now()]);

        try {
            foreach ($agent->steps() as $i => $step) {
                $run->update(['current_step' => $i + 1]);

                match (true) {
                    $step instanceof GatherStep => $this->executeGather($step, $ctx),
                    $step instanceof AiStep     => $this->executeAi($step, $ctx, $agent, $run),
                    $step instanceof NotifyStep => $this->executeNotify($step, $ctx, $run),
                };
            }

            [$resultText, $resultPayload] = $agent->compile($ctx);

            $run->update([
                'status'         => AgentRunStatus::Completed,
                'result_text'    => $resultText,
                'result_payload' => $resultPayload,
                'completed_at'   => now(),
            ]);
        } catch (InsufficientCreditsException $e) {
            // Save partial results if any AI steps completed
            [$resultText, $resultPayload] = $agent->compile($ctx);
            $run->update([
                'status'         => AgentRunStatus::Partial,
                'result_text'    => $resultText,
                'result_payload' => $resultPayload,
                'error_message'  => 'Insufficient credits to complete all steps.',
                'failed_at'      => now(),
            ]);
        } catch (\Throwable $e) {
            $run->update([
                'status'        => AgentRunStatus::Failed,
                'error_message' => $e->getMessage(),
                'failed_at'     => now(),
            ]);
        }

        return $run;
    }

    private function executeGather(GatherStep $step, AgentContext $ctx): void
    {
        $ctx->gathered[$step->name] = ($step->gather)($ctx);
    }

    private function executeAi(AiStep $step, AgentContext $ctx, AgentInterface $agent, AgentRun $run): void
    {
        // Consume credits
        $this->creditService->consume(
            $ctx->user->tenant,
            $ctx->user,
            $agent->type()->value,
            $agent->creditCost(),
            ['agent_run_id' => $run->id, 'step' => $step->name],
        );
        $run->increment('credits_consumed', $agent->creditCost());

        // Build and execute prompt
        [$systemPrompt, $userPrompt] = ($step->buildMessages)($ctx);
        $result = $this->aiService->runRaw($systemPrompt, $userPrompt);
        $ctx->aiResults[$step->name] = $result['content'];
    }

    private function executeNotify(NotifyStep $step, AgentContext $ctx, AgentRun $run): void
    {
        // Check user preferences before sending
        $pref = AgentPreference::where('user_id', $ctx->user->id)
            ->where('agent_type', $run->agent_type)
            ->first();

        if ($pref && !$pref->is_enabled) return;

        // Create in-app notification
        if (!$pref || $pref->notify_in_app) {
            CaseNotification::create([
                'tenant_id'         => $ctx->user->tenant_id,
                'user_id'           => $ctx->user->id,
                'case_id'           => $ctx->input['case_id'] ?? null,
                'notification_type' => $step->notificationType,
                'channel'           => 'in_app',
                'title'             => $ctx->notificationTitle,
                'body'              => $ctx->notificationBody,
                'status'            => 'sent',
                'sent_at'           => now(),
            ]);
        }

        // Send email notification
        if (!$pref || $pref->notify_email) {
            Mail::to($ctx->user)->queue(new AgentResultMail($run));
        }
    }
}
```

### 1.10 AgentContext

```php
class AgentContext
{
    public array $gathered = [];
    public array $aiResults = [];
    public string $notificationTitle = '';
    public string $notificationBody = '';

    public function __construct(
        public readonly User $user,
        public readonly array $input,
        public readonly AgentRun $run,
    ) {}
}
```

### 1.11 ProcessAgentJob

```php
class ProcessAgentJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 2;
    public int $timeout = 120;

    public function __construct(
        public readonly int $tenantId,
        public readonly string $agentType,
        public readonly int $userId,
        public readonly array $input,
    ) {}

    public function handle(AgentOrchestrator $orchestrator): void
    {
        // Set tenant context
        $tenant = Tenant::findOrFail($this->tenantId);
        tenancy()->initialize($tenant);

        $user  = User::findOrFail($this->userId);
        $agent = AgentFactory::make(AgentType::from($this->agentType));

        $orchestrator->run($agent, $user, $this->input);
    }
}
```

### 1.12 File List — Phase 1

| # | File | Type |
|---|------|------|
| 1 | `backend/database/migrations/XXXX_create_agent_runs_table.php` | New |
| 2 | `backend/database/migrations/XXXX_create_agent_preferences_table.php` | New |
| 3 | `backend/app/Domain/Agent/Enums/AgentType.php` | New |
| 4 | `backend/app/Domain/Agent/Enums/AgentRunStatus.php` | New |
| 5 | `backend/app/Domain/Agent/Models/AgentRun.php` | New |
| 6 | `backend/app/Domain/Agent/Models/AgentPreference.php` | New |
| 7 | `backend/app/Domain/Agent/Contracts/AgentInterface.php` | New |
| 8 | `backend/app/Domain/Agent/Steps/GatherStep.php` | New |
| 9 | `backend/app/Domain/Agent/Steps/AiStep.php` | New |
| 10 | `backend/app/Domain/Agent/Steps/NotifyStep.php` | New |
| 11 | `backend/app/Domain/Agent/Services/AgentOrchestrator.php` | New |
| 12 | `backend/app/Domain/Agent/Services/AgentContext.php` | New |
| 13 | `backend/app/Domain/Agent/Services/AgentFactory.php` | New |
| 14 | `backend/app/Jobs/Agent/ProcessAgentJob.php` | New |
| 15 | `backend/app/Domain/Ai/Services/AiExecutionService.php` | Modified (add `runRaw` method) |

---

## Phase 2: Daily Briefing Agent

### What It Does

Every morning at 7 AM (configurable), for each user with this agent enabled:

1. **Gather** today's hearings with case details
2. **Gather** upcoming deadlines (hearings in next 7 days)
3. **Gather** stale cases (no activity in 14+ days)
4. **Gather** unread notifications count
5. **AI call** — compile everything into a natural-language briefing in the user's preferred language
6. **Notify** — in-app notification + email digest

### 2.1 DailyBriefingAgent

```php
class DailyBriefingAgent implements AgentInterface
{
    public function type(): AgentType { return AgentType::DailyBriefing; }
    public function creditCost(): int { return 3; } // single AI call

    public function steps(): array
    {
        return [
            new GatherStep('data', function (AgentContext $ctx) {
                $userId   = $ctx->user->id;
                $tenantId = $ctx->user->tenant_id;
                $today    = now()->toDateString();

                // Today's hearings
                $todayHearings = Hearing::where('tenant_id', $tenantId)
                    ->whereDate('hearing_at', $today)
                    ->whereHas('case', fn ($q) => $q->whereHas('participants', fn ($p) => $p->where('user_id', $userId)))
                    ->with('case:id,public_id,title,case_number,court', 'case.client:id,name')
                    ->orderBy('hearing_at')
                    ->get();

                // Next 7 days hearings
                $upcomingHearings = Hearing::where('tenant_id', $tenantId)
                    ->whereDate('hearing_at', '>', $today)
                    ->whereDate('hearing_at', '<=', now()->addDays(7)->toDateString())
                    ->whereHas('case', fn ($q) => $q->whereHas('participants', fn ($p) => $p->where('user_id', $userId)))
                    ->with('case:id,title,case_number')
                    ->orderBy('hearing_at')
                    ->get();

                // Stale cases (no hearing or diary entry in 14+ days)
                $staleCases = CaseFile::where('tenant_id', $tenantId)
                    ->whereIn('status', ['open', 'active'])
                    ->whereHas('participants', fn ($p) => $p->where('user_id', $userId))
                    ->where(function ($q) {
                        $q->whereDoesntHave('hearings', fn ($h) => $h->where('hearing_at', '>=', now()->subDays(14)))
                          ->whereDoesntHave('diaryEntries', fn ($d) => $d->where('entry_at', '>=', now()->subDays(14)));
                    })
                    ->select('id', 'public_id', 'title', 'case_number', 'status', 'updated_at')
                    ->limit(10)
                    ->get();

                // Unread notifications
                $unreadCount = CaseNotification::where('user_id', $userId)
                    ->where('status', '!=', 'read')
                    ->count();

                return compact('todayHearings', 'upcomingHearings', 'staleCases', 'unreadCount');
            }),

            new AiStep('briefing', function (AgentContext $ctx) {
                $data = $ctx->gathered['data'];
                $lang = $ctx->user->locale ?? 'en';

                $systemPrompt = "You are a legal assistant for a Bangladeshi lawyer. "
                    . "Generate a concise morning briefing summarizing their day. "
                    . "Use clear headings, bullet points, and keep it actionable. "
                    . "Language: " . ($lang === 'bn' ? 'Bengali' : 'English') . ". "
                    . "Do not give legal advice.";

                $hearingsText = $data['todayHearings']->map(fn ($h) =>
                    "- {$h->case->title} ({$h->case->case_number}) at {$h->hearing_at->format('h:i A')}"
                    . ($h->location ? " in {$h->location}" : '')
                    . ($h->agenda ? " — Agenda: {$h->agenda}" : '')
                    . " — Client: " . ($h->case->client->name ?? 'N/A')
                )->join("\n");

                $upcomingText = $data['upcomingHearings']->map(fn ($h) =>
                    "- {$h->hearing_at->format('M d')}: {$h->case->title} ({$h->case->case_number})"
                )->join("\n");

                $staleText = $data['staleCases']->map(fn ($c) =>
                    "- {$c->title} ({$c->case_number}) — last activity: {$c->updated_at->diffForHumans()}"
                )->join("\n");

                $userPrompt = "Generate my morning briefing for " . now()->format('l, F j, Y') . ".\n\n"
                    . "TODAY'S HEARINGS (" . $data['todayHearings']->count() . "):\n"
                    . ($hearingsText ?: "None scheduled.") . "\n\n"
                    . "UPCOMING THIS WEEK (" . $data['upcomingHearings']->count() . "):\n"
                    . ($upcomingText ?: "None.") . "\n\n"
                    . "CASES NEEDING ATTENTION (" . $data['staleCases']->count() . "):\n"
                    . ($staleText ?: "All cases are active.") . "\n\n"
                    . "UNREAD NOTIFICATIONS: " . $data['unreadCount'];

                return [$systemPrompt, $userPrompt];
            }),

            new NotifyStep('notify', ['in_app', 'email'], 'daily_briefing'),
        ];
    }

    public function compile(AgentContext $ctx): array
    {
        $data       = $ctx->gathered['data'] ?? [];
        $briefing   = $ctx->aiResults['briefing'] ?? '';
        $hearings   = $data['todayHearings'] ?? collect();

        $ctx->notificationTitle = $hearings->count() . ' hearing(s) today';
        $ctx->notificationBody  = Str::limit($briefing, 200);

        return [
            $briefing,
            [
                'today_hearing_count'    => $hearings->count(),
                'upcoming_hearing_count' => ($data['upcomingHearings'] ?? collect())->count(),
                'stale_case_count'       => ($data['staleCases'] ?? collect())->count(),
                'unread_count'           => $data['unreadCount'] ?? 0,
            ],
        ];
    }
}
```

### 2.2 Scheduled Job — `RunDailyBriefingJob`

```php
class RunDailyBriefingJob implements ShouldQueue
{
    public function handle(AgentOrchestrator $orchestrator): void
    {
        // Find all users who have daily briefing enabled (or haven't disabled it)
        $users = User::whereHas('tenant', fn ($q) => $q->where('is_active', true))
            ->where(function ($q) {
                $q->whereDoesntHave('agentPreferences', fn ($p) =>
                    $p->where('agent_type', AgentType::DailyBriefing)
                      ->where('is_enabled', false)
                )
                ->orWhereHas('agentPreferences', fn ($p) =>
                    $p->where('agent_type', AgentType::DailyBriefing)
                      ->where('is_enabled', true)
                );
            })
            ->get();

        foreach ($users as $user) {
            try {
                tenancy()->initialize($user->tenant);
                $agent = new DailyBriefingAgent();
                $orchestrator->run($agent, $user, []);
            } catch (\Throwable $e) {
                Log::warning("Daily briefing failed for user {$user->id}: {$e->getMessage()}");
            }
        }
    }
}
```

### 2.3 Schedule Registration

```php
// Kernel.php
$schedule->job(new RunDailyBriefingJob)->dailyAt('07:00');
```

### 2.4 File List — Phase 2

| # | File | Type |
|---|------|------|
| 1 | `backend/app/Domain/Agent/Agents/DailyBriefingAgent.php` | New |
| 2 | `backend/app/Jobs/Agent/RunDailyBriefingJob.php` | New |
| 3 | `backend/app/Console/Kernel.php` | Modified |

---

## Phase 3: Hearing Prep Agent

### What It Does

Every evening at 9 PM, for each hearing scheduled tomorrow:

1. **Gather** full case record — title, number, court, status, story, petition draft
2. **Gather** all parties (client, opponents) with roles
3. **Gather** hearing history for this case — past dates, outcomes, next steps
4. **Gather** recent diary entries (last 10)
5. **Gather** document list (names, categories)
6. **AI call 1** — summarize case history and key issues
7. **AI call 2** — generate preparation brief with arguments, documents to carry, key points
8. **Notify** — in-app + email with the prep brief

### 3.1 HearingPrepAgent

```php
class HearingPrepAgent implements AgentInterface
{
    public function type(): AgentType { return AgentType::HearingPrep; }
    public function creditCost(): int { return 5; } // per AI step

    public function steps(): array
    {
        return [
            // Step 1: Gather complete case context
            new GatherStep('case_data', function (AgentContext $ctx) {
                $hearing = Hearing::with([
                    'case.client',
                    'case.parties',
                    'case.participants.user',
                    'case.court',
                ])->findOrFail($ctx->input['hearing_id']);

                return [
                    'hearing'  => $hearing,
                    'case'     => $hearing->case,
                    'client'   => $hearing->case->client,
                    'parties'  => $hearing->case->parties,
                    'court'    => $hearing->case->court,
                ];
            }),

            // Step 2: Gather hearing history + diary + documents
            new GatherStep('history', function (AgentContext $ctx) {
                $case = $ctx->gathered['case_data']['case'];

                $pastHearings = $case->hearings()
                    ->where('hearing_at', '<', now())
                    ->orderByDesc('hearing_at')
                    ->limit(15)
                    ->get(['hearing_at', 'type', 'agenda', 'outcome', 'minutes', 'next_steps']);

                $diaryEntries = $case->diaryEntries()
                    ->orderByDesc('entry_at')
                    ->limit(10)
                    ->get(['entry_at', 'title', 'body']);

                $documents = $case->documents()
                    ->orderByDesc('created_at')
                    ->get(['original_name', 'category', 'created_at']);

                return compact('pastHearings', 'diaryEntries', 'documents');
            }),

            // Step 3: AI summarizes case history
            new AiStep('case_summary', function (AgentContext $ctx) {
                $data    = $ctx->gathered['case_data'];
                $history = $ctx->gathered['history'];
                $lang    = $ctx->user->locale ?? 'en';
                $case    = $data['case'];

                $systemPrompt = "You are an expert legal assistant for Bangladeshi lawyers. "
                    . "Summarize the case history focusing on: key facts, procedural status, "
                    . "critical dates, and current position of each party. "
                    . "Language: " . ($lang === 'bn' ? 'Bengali' : 'English') . ". "
                    . "Be concise and factual. Do not give legal advice.";

                $partiesText = $data['parties']->map(fn ($p) =>
                    "- {$p->name} ({$p->side}, {$p->role->value})"
                )->join("\n");

                $hearingsText = $history['pastHearings']->map(fn ($h) =>
                    "- {$h->hearing_at->format('Y-m-d')} [{$h->type->value}]: "
                    . ($h->outcome ?? 'No outcome recorded')
                    . ($h->next_steps ? " → Next: {$h->next_steps}" : '')
                )->join("\n");

                $userPrompt = "CASE: {$case->title}\n"
                    . "NUMBER: {$case->case_number}\n"
                    . "COURT: " . ($data['court']?->name ?? $case->court ?? 'N/A') . "\n"
                    . "STATUS: {$case->status->value}\n\n"
                    . "FACTS:\n{$case->story}\n\n"
                    . "PARTIES:\n{$partiesText}\n\n"
                    . "HEARING HISTORY:\n"
                    . ($hearingsText ?: 'No prior hearings.') . "\n\n"
                    . "Provide a concise case summary highlighting the current position.";

                return [$systemPrompt, $userPrompt];
            }),

            // Step 4: AI generates preparation brief
            new AiStep('prep_brief', function (AgentContext $ctx) {
                $data       = $ctx->gathered['case_data'];
                $history    = $ctx->gathered['history'];
                $summary    = $ctx->aiResults['case_summary'];
                $hearing    = $data['hearing'];
                $lang       = $ctx->user->locale ?? 'en';

                $systemPrompt = "You are a senior legal assistant preparing a hearing brief for a Bangladeshi lawyer. "
                    . "Based on the case summary and hearing details, generate a practical preparation brief. "
                    . "Include: (1) Key points to argue, (2) Anticipated opposing arguments, "
                    . "(3) Relevant law sections to cite, (4) Documents to carry, "
                    . "(5) Questions to ask witnesses if applicable, (6) Recommended strategy. "
                    . "Language: " . ($lang === 'bn' ? 'Bengali' : 'English') . ". "
                    . "Be practical and actionable. Do not give legal advice — suggest strategic options.";

                $docsText = $history['documents']->map(fn ($d) =>
                    "- [{$d->category->value}] {$d->original_name} (uploaded {$d->created_at->format('Y-m-d')})"
                )->join("\n");

                $diaryText = $history['diaryEntries']->map(fn ($d) =>
                    "- {$d->entry_at?->format('Y-m-d')}: {$d->title}\n  {$d->body}"
                )->join("\n");

                $userPrompt = "CASE SUMMARY:\n{$summary}\n\n"
                    . "TOMORROW'S HEARING:\n"
                    . "- Date: {$hearing->hearing_at->format('l, F j, Y \\a\\t h:i A')}\n"
                    . "- Type: {$hearing->type->value}\n"
                    . "- Location: " . ($hearing->location ?? 'Not specified') . "\n"
                    . "- Agenda: " . ($hearing->agenda ?? 'Not specified') . "\n\n"
                    . "AVAILABLE DOCUMENTS:\n" . ($docsText ?: 'None uploaded.') . "\n\n"
                    . "RECENT NOTES:\n" . ($diaryText ?: 'None.') . "\n\n"
                    . "Generate a detailed hearing preparation brief.";

                return [$systemPrompt, $userPrompt];
            }),

            new NotifyStep('notify', ['in_app', 'email'], 'hearing_prep'),
        ];
    }

    public function compile(AgentContext $ctx): array
    {
        $data     = $ctx->gathered['case_data'] ?? [];
        $hearing  = $data['hearing'] ?? null;
        $summary  = $ctx->aiResults['case_summary'] ?? '';
        $brief    = $ctx->aiResults['prep_brief'] ?? '';

        $fullResult = "# Hearing Preparation Brief\n\n"
            . "**Case:** " . ($hearing?->case?->title ?? 'Unknown') . "\n"
            . "**Hearing:** " . ($hearing?->hearing_at?->format('l, F j, Y \\a\\t h:i A') ?? 'Unknown') . "\n\n"
            . "---\n\n"
            . "## Case Summary\n\n{$summary}\n\n"
            . "---\n\n"
            . "## Preparation Brief\n\n{$brief}";

        $ctx->notificationTitle = 'Hearing prep ready: ' . ($hearing?->case?->title ?? 'Case');
        $ctx->notificationBody  = 'Your preparation brief for tomorrow\'s hearing is ready. Tap to view.';

        return [
            $fullResult,
            [
                'hearing_id'   => $hearing?->id,
                'case_id'      => $hearing?->case_id,
                'case_title'   => $hearing?->case?->title,
                'hearing_date' => $hearing?->hearing_at?->toISOString(),
            ],
        ];
    }
}
```

### 3.2 Scheduled Job — `RunHearingPrepJob`

```php
class RunHearingPrepJob implements ShouldQueue
{
    public function handle(AgentOrchestrator $orchestrator): void
    {
        $tomorrow = now()->addDay()->toDateString();

        $hearings = Hearing::whereDate('hearing_at', $tomorrow)
            ->whereHas('case', fn ($q) => $q->whereIn('status', ['open', 'active']))
            ->with('case.participants.user')
            ->get();

        foreach ($hearings as $hearing) {
            // Run for lead lawyer / first participant
            $leadParticipant = $hearing->case->participants
                ->sortBy(fn ($p) => $p->role === 'lead_lawyer' ? 0 : 1)
                ->first();

            if (!$leadParticipant) continue;

            $user = $leadParticipant->user;

            // Check preference
            $pref = AgentPreference::where('user_id', $user->id)
                ->where('agent_type', AgentType::HearingPrep)
                ->first();

            if ($pref && !$pref->is_enabled) continue;

            try {
                tenancy()->initialize($user->tenant);
                $agent = new HearingPrepAgent();
                $orchestrator->run($agent, $user, ['hearing_id' => $hearing->id]);
            } catch (\Throwable $e) {
                Log::warning("Hearing prep failed for hearing {$hearing->id}: {$e->getMessage()}");
            }
        }
    }
}
```

### 3.3 Schedule Registration

```php
// Kernel.php
$schedule->job(new RunHearingPrepJob)->dailyAt('21:00');
```

### 3.4 File List — Phase 3

| # | File | Type |
|---|------|------|
| 1 | `backend/app/Domain/Agent/Agents/HearingPrepAgent.php` | New |
| 2 | `backend/app/Jobs/Agent/RunHearingPrepJob.php` | New |
| 3 | `backend/app/Console/Kernel.php` | Modified |

---

## Phase 4: Agentic Case Intake

### What It Does

User opens the case intake chat. Instead of filling a complex form, they have a conversation:

```
Agent: Hi! Let's set up your new case. What type of case is this?
       (Criminal / Civil / Family / Labour / Other)

User:  Criminal case, bail application

Agent: Got it — criminal bail application. Who is your client?

User:  Mohammad Rahim, phone 01712345678

Agent: And who is the opposing party?

User:  The State, represented by the Public Prosecutor

Agent: Which court will this be filed in?

User:  CMM Court, Dhaka

Agent: Can you briefly describe the facts of the case?

User:  My client was arrested on April 10 under Section 420 of the Penal Code...

Agent: Thank you. I found 2 existing clients matching "Mohammad Rahim":
       1. Mohammad Rahim (01712345678) — existing client
       2. Create new client
       Which one?

User:  1

Agent: Is there a first hearing date scheduled?

User:  April 20 at 10 AM

Agent: Here's what I'll create:
       ✓ Case: "State vs. Mohammad Rahim — Bail Application"
       ✓ Client: Mohammad Rahim (existing)
       ✓ Opponent: The State (Public Prosecutor)
       ✓ Court: CMM Court, Dhaka
       ✓ First hearing: April 20, 2026 at 10:00 AM
       ✓ Case type: Criminal — Bail Application

       Shall I create this case? [Create Case] [Edit Details]
```

### Architecture — Multi-Turn Conversation

Unlike the other agents which are fire-and-forget, Case Intake is **interactive**. It uses a state machine pattern:

```
States:
  ASKING_CASE_TYPE → ASKING_CLIENT → ASKING_OPPONENT → ASKING_COURT
  → ASKING_FACTS → ASKING_HEARING → CONFIRMING → CREATING → DONE
```

Each turn:
1. Frontend sends user message + current conversation state
2. Backend resolves the current step
3. AI parses the user's natural language response and extracts structured data
4. Backend advances the state machine
5. AI generates the next question

### 4.1 Migration — `case_intake_sessions` table

```
case_intake_sessions:
  id                bigint PK
  public_id         ulid UNIQUE
  tenant_id         FK → tenants (CASCADE)
  user_id           FK → users (CASCADE)
  status            string(30)     -- 'active', 'completed', 'abandoned'
  current_step      string(30)     -- state machine step
  collected_data    JSON           -- structured data extracted so far
  messages          JSON           -- conversation history [{role, content, timestamp}]
  case_id           FK → cases nullable  -- created case reference
  created_at        timestamp
  updated_at        timestamp

  INDEX (tenant_id, user_id, status)
```

### 4.2 Enum — `IntakeStep`

```php
enum IntakeStep: string
{
    case AskingCaseType = 'asking_case_type';
    case AskingClient   = 'asking_client';
    case AskingOpponent = 'asking_opponent';
    case AskingCourt    = 'asking_court';
    case AskingFacts    = 'asking_facts';
    case AskingHearing  = 'asking_hearing';
    case Confirming     = 'confirming';
    case Creating       = 'creating';
    case Done           = 'done';
}
```

### 4.3 Model — `CaseIntakeSession`

```php
class CaseIntakeSession extends Model
{
    use HasUlid, BelongsToTenant;

    protected $casts = [
        'current_step'   => IntakeStep::class,
        'collected_data'  => 'array',
        'messages'        => 'array',
    ];

    public function user(): BelongsTo;
    public function case(): BelongsTo;  // nullable, set after creation
}
```

### 4.4 CaseIntakeService

```php
class CaseIntakeService
{
    public function __construct(
        private AiExecutionService $aiService,
        private AiCreditService $creditService,
    ) {}

    /**
     * Start a new intake session.
     */
    public function start(User $user): CaseIntakeSession
    {
        $session = CaseIntakeSession::create([
            'tenant_id'      => $user->tenant_id,
            'user_id'        => $user->id,
            'status'         => 'active',
            'current_step'   => IntakeStep::AskingCaseType,
            'collected_data' => [],
            'messages'       => [[
                'role'    => 'assistant',
                'content' => $this->getStepPrompt(IntakeStep::AskingCaseType, $user, []),
                'ts'      => now()->toISOString(),
            ]],
        ]);

        return $session;
    }

    /**
     * Process a user message and advance the conversation.
     */
    public function reply(CaseIntakeSession $session, string $userMessage): array
    {
        // 1. Add user message to history
        $messages   = $session->messages;
        $messages[] = ['role' => 'user', 'content' => $userMessage, 'ts' => now()->toISOString()];

        // 2. Use AI to extract structured data from user's response
        $extracted = $this->extractData($session, $userMessage);

        // 3. Merge extracted data into collected_data
        $collected = array_merge($session->collected_data, $extracted);

        // 4. Determine next step
        $nextStep = $this->resolveNextStep($session->current_step, $collected);

        // 5. If confirming and user said yes → create the case
        if ($session->current_step === IntakeStep::Confirming && $this->isConfirmation($userMessage)) {
            $nextStep = IntakeStep::Creating;
        }

        // 6. Generate assistant response
        if ($nextStep === IntakeStep::Creating) {
            $case = $this->createCase($session->user, $collected);
            $session->update([
                'current_step'   => IntakeStep::Done,
                'status'         => 'completed',
                'collected_data' => $collected,
                'case_id'        => $case->id,
            ]);
            $assistantMsg = $this->getCreatedMessage($case, $session->user);
        } else {
            // Handle client matching if at AskingClient step
            if ($nextStep === IntakeStep::AskingOpponent && isset($collected['client_query'])) {
                $matches = $this->findMatchingClients($session->user->tenant_id, $collected['client_query']);
                $collected['client_matches'] = $matches->toArray();
            }

            $assistantMsg = $this->getStepPrompt($nextStep, $session->user, $collected);
        }

        $messages[] = ['role' => 'assistant', 'content' => $assistantMsg, 'ts' => now()->toISOString()];

        $session->update([
            'current_step'   => $nextStep === IntakeStep::Creating ? IntakeStep::Done : $nextStep,
            'collected_data'  => $collected,
            'messages'        => $messages,
        ]);

        return [
            'message'  => $assistantMsg,
            'step'     => $nextStep->value,
            'collected' => $collected,
            'case_id'  => $session->case_id,
        ];
    }

    /**
     * Use AI to extract structured data from free-text user input.
     */
    private function extractData(CaseIntakeSession $session, string $userMessage): array
    {
        $step = $session->current_step;

        $systemPrompt = "You are a data extraction assistant. Extract structured data from the user's "
            . "natural language response. Return ONLY valid JSON, no explanation.\n\n"
            . "Current step: {$step->value}\n"
            . "Already collected: " . json_encode($session->collected_data);

        $fields = match ($step) {
            IntakeStep::AskingCaseType => '{"case_type": "criminal|civil|family|labour|other", "case_subtype": "string or null"}',
            IntakeStep::AskingClient   => '{"client_name": "string", "client_phone": "string or null", "client_email": "string or null", "client_type": "person|organization"}',
            IntakeStep::AskingOpponent => '{"opponent_name": "string", "opponent_role": "respondent|defendant|accused|state|other", "opponent_type": "person|organization"}',
            IntakeStep::AskingCourt    => '{"court_name": "string", "case_number": "string or null"}',
            IntakeStep::AskingFacts    => '{"story": "string", "suggested_title": "string"}',
            IntakeStep::AskingHearing  => '{"hearing_date": "YYYY-MM-DD or null", "hearing_time": "HH:MM or null", "hearing_type": "mention|hearing|trial|order"}',
            default => '{}',
        };

        $userPrompt = "Extract these fields: {$fields}\n\nUser said: \"{$userMessage}\"";

        $result = $this->aiService->runRaw($systemPrompt, $userPrompt);

        return json_decode($result['content'], true) ?? [];
    }

    private function resolveNextStep(IntakeStep $current, array $collected): IntakeStep
    {
        return match ($current) {
            IntakeStep::AskingCaseType => IntakeStep::AskingClient,
            IntakeStep::AskingClient   => IntakeStep::AskingOpponent,
            IntakeStep::AskingOpponent => IntakeStep::AskingCourt,
            IntakeStep::AskingCourt    => IntakeStep::AskingFacts,
            IntakeStep::AskingFacts    => IntakeStep::AskingHearing,
            IntakeStep::AskingHearing  => IntakeStep::Confirming,
            IntakeStep::Confirming     => IntakeStep::Confirming, // stays until confirmed
            default                    => IntakeStep::Done,
        };
    }

    private function findMatchingClients(int $tenantId, string $query): Collection
    {
        return Client::where('tenant_id', $tenantId)
            ->where(fn ($q) => $q->where('name', 'like', "%{$query}%")
                ->orWhere('phone', 'like', "%{$query}%")
                ->orWhere('email', 'like', "%{$query}%"))
            ->limit(5)
            ->get(['id', 'name', 'phone', 'email', 'type']);
    }

    private function createCase(User $user, array $data): CaseFile
    {
        // Delegate to existing CreateCaseAction
        $action = app(CreateCaseAction::class);

        return $action->handle($user, [
            'title'          => $data['suggested_title'] ?? "{$data['opponent_name']} — {$data['case_subtype'] ?? $data['case_type']}",
            'court'          => $data['court_name'] ?? null,
            'case_number'    => $data['case_number'] ?? null,
            'story'          => $data['story'] ?? '',
            'petition_draft' => '',
            'status'         => 'open',
            'client'         => [
                'name'  => $data['client_name'] ?? null,
                'phone' => $data['client_phone'] ?? null,
                'email' => $data['client_email'] ?? null,
                'type'  => $data['client_type'] ?? 'person',
            ],
            'parties' => [
                [
                    'name' => $data['opponent_name'] ?? 'Unknown',
                    'side' => 'opponent',
                    'role' => $data['opponent_role'] ?? 'respondent',
                    'type' => $data['opponent_type'] ?? 'person',
                ],
            ],
            'first_hearing' => ($data['hearing_date'] ?? null) ? [
                'hearing_at' => $data['hearing_date'] . ' ' . ($data['hearing_time'] ?? '10:00'),
                'type'       => $data['hearing_type'] ?? 'hearing',
            ] : null,
        ]);
    }
}
```

### 4.5 Controller — `CaseIntakeController`

```php
class CaseIntakeController extends Controller
{
    public function start(Request $request, CaseIntakeService $service)
    {
        $session = $service->start($request->user());
        return new CaseIntakeSessionResource($session);
    }

    public function reply(Request $request, string $publicId, CaseIntakeService $service)
    {
        $request->validate(['message' => 'required|string|max:2000']);

        $session = CaseIntakeSession::where('public_id', $publicId)
            ->where('user_id', $request->user()->id)
            ->where('status', 'active')
            ->firstOrFail();

        $result = $service->reply($session, $request->input('message'));

        return response()->json(['data' => $result]);
    }

    public function show(Request $request, string $publicId)
    {
        $session = CaseIntakeSession::where('public_id', $publicId)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        return new CaseIntakeSessionResource($session);
    }
}
```

### 4.6 Routes

```php
// Tenant-scoped group
Route::post('/case-intake', [CaseIntakeController::class, 'start']);
Route::post('/case-intake/{publicId}/reply', [CaseIntakeController::class, 'reply']);
Route::get('/case-intake/{publicId}', [CaseIntakeController::class, 'show']);
```

### 4.7 Frontend — Chat Interface

```
frontend/
  features/case-intake/
    use-case-intake.ts       -- hooks: useStartIntake(), useIntakeReply(), useIntakeSession()
  app/(workspace)/cases/
    intake/
      page.tsx               -- Chat UI with message bubbles, quick-reply buttons
```

**UI Flow:**
- Full-screen chat interface (like a messaging app)
- Assistant messages appear on the left with the CaseDex AI avatar
- User types on the bottom input bar
- Quick-reply buttons for structured options (case type, yes/no confirmation)
- At the confirmation step, show a structured card with all collected data
- "Create Case" button triggers case creation
- On success, redirect to the new case page

### 4.8 Credit Cost

Case intake uses 1 AI call per user message (for extraction) + the step prompt generation. Estimate ~6-8 turns per session.

```php
// config/billing.php — add to feature_costs
'case_intake_turn' => 1,  // per message
```

### 4.9 File List — Phase 4

| # | File | Type |
|---|------|------|
| 1 | `backend/database/migrations/XXXX_create_case_intake_sessions_table.php` | New |
| 2 | `backend/app/Domain/Agent/Enums/IntakeStep.php` | New |
| 3 | `backend/app/Domain/Agent/Models/CaseIntakeSession.php` | New |
| 4 | `backend/app/Domain/Agent/Services/CaseIntakeService.php` | New |
| 5 | `backend/app/Http/Controllers/Api/V1/CaseIntakeController.php` | New |
| 6 | `backend/app/Http/Resources/Api/V1/CaseIntakeSessionResource.php` | New |
| 7 | `backend/routes/api.php` | Modified |
| 8 | `backend/config/billing.php` | Modified |
| 9 | `frontend/features/case-intake/use-case-intake.ts` | New |
| 10 | `frontend/app/(workspace)/cases/intake/page.tsx` | New |
| 11 | `frontend/lib/i18n.ts` | Modified |

---

## Phase 5: Frontend — Agent Dashboard & Settings

### 5.1 Agent Results Page

Display past agent runs with results. Accessible from dashboard and notifications.

```
frontend/
  features/agent/
    use-agent.ts              -- hooks: useAgentRuns(), useAgentRun(), useAgentPreferences()
  app/(workspace)/
    agent/
      page.tsx                -- Agent runs list (briefings, prep briefs)
      [publicId]/
        page.tsx              -- Single agent run result (full brief with markdown)
```

### 5.2 Dashboard Integration

Add agent cards to the dashboard:

```
┌─────────────────────────────────────────┐
│  Today's Briefing              7:00 AM  │
│  ───────────────────────────────────     │
│  3 hearings today • 2 upcoming          │
│  1 case needs attention                 │
│  [View Full Briefing →]                 │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Hearing Prep Ready            9:00 PM  │
│  ───────────────────────────────────     │
│  Rahman vs. State — Bail Application    │
│  Tomorrow, 10:30 AM • CMM Court, Dhaka  │
│  [View Prep Brief →]                    │
└─────────────────────────────────────────┘
```

### 5.3 Agent Preferences Page

Settings page where users can:
- Enable/disable each agent
- Toggle email notifications
- Configure briefing time (daily briefing)

```
frontend/
  app/(workspace)/settings/
    agents/
      page.tsx                -- Agent preferences UI
```

### 5.4 Backend API for Agent Runs & Preferences

```php
// Routes — tenant-scoped group
Route::get('/agent/runs', [AgentRunController::class, 'index']);
Route::get('/agent/runs/{publicId}', [AgentRunController::class, 'show']);
Route::get('/agent/preferences', [AgentPreferenceController::class, 'index']);
Route::put('/agent/preferences/{agentType}', [AgentPreferenceController::class, 'update']);
```

### 5.5 File List — Phase 5

| # | File | Type |
|---|------|------|
| 1 | `backend/app/Http/Controllers/Api/V1/AgentRunController.php` | New |
| 2 | `backend/app/Http/Controllers/Api/V1/AgentPreferenceController.php` | New |
| 3 | `backend/app/Http/Resources/Api/V1/AgentRunResource.php` | New |
| 4 | `backend/app/Http/Resources/Api/V1/AgentPreferenceResource.php` | New |
| 5 | `backend/routes/api.php` | Modified |
| 6 | `frontend/features/agent/use-agent.ts` | New |
| 7 | `frontend/app/(workspace)/agent/page.tsx` | New |
| 8 | `frontend/app/(workspace)/agent/[publicId]/page.tsx` | New |
| 9 | `frontend/app/(workspace)/settings/agents/page.tsx` | New |
| 10 | `frontend/app/(workspace)/dashboard/page.tsx` | Modified |
| 11 | `frontend/lib/i18n.ts` | Modified |
| 12 | `frontend/app/(workspace)/layout.tsx` | Modified (add nav item) |

---

## Phase 6: Email Templates

### 6.1 Daily Briefing Email

Markdown-rendered email with:
- Morning greeting
- Today's hearings in a table
- Upcoming deadlines
- Stale cases alert
- Link to full briefing in dashboard

### 6.2 Hearing Prep Email

Markdown-rendered email with:
- Case name and tomorrow's hearing details
- Condensed prep brief
- Document list with download links
- Link to full brief in dashboard

### 6.3 File List — Phase 6

| # | File | Type |
|---|------|------|
| 1 | `backend/app/Mail/DailyBriefingMail.php` | New |
| 2 | `backend/app/Mail/HearingPrepMail.php` | New |
| 3 | `backend/resources/views/emails/daily-briefing.blade.php` | New |
| 4 | `backend/resources/views/emails/hearing-prep.blade.php` | New |

---

## Complete File Summary

| Phase | New Files | Modified Files | Total |
|-------|-----------|---------------|-------|
| 1 — Infrastructure | 14 | 1 | 15 |
| 2 — Daily Briefing | 2 | 1 | 3 |
| 3 — Hearing Prep | 2 | 1 | 3 |
| 4 — Case Intake | 8 | 3 | 11 |
| 5 — Frontend | 8 | 4 | 12 |
| 6 — Email Templates | 4 | 0 | 4 |
| **Total** | **38** | **10** | **48** |

---

## Build Order

| Week | Phase | Deliverable |
|------|-------|------------|
| 1 | Phase 1 | Agent infrastructure (orchestrator, models, migrations) |
| 1 | Phase 2 | Daily Briefing agent (backend only, test via artisan) |
| 2 | Phase 3 | Hearing Prep agent (backend only, test via artisan) |
| 2 | Phase 5 (partial) | API endpoints for agent runs + preferences |
| 3 | Phase 5 (rest) | Frontend: agent dashboard, results page, settings |
| 3 | Phase 6 | Email templates |
| 4 | Phase 4 | Case Intake — backend service + chat API |
| 4 | Phase 4 (frontend) | Case Intake — chat UI |

---

## Credit Cost Summary

| Agent | Credits per Run | Frequency | Monthly Cost (1 user) |
|-------|----------------|-----------|----------------------|
| Daily Briefing | 3 | Daily | ~90 credits |
| Hearing Prep | 10 | Per hearing | ~40-80 credits (4-8 hearings) |
| Case Intake | ~7 | Per case | ~35-70 credits (5-10 cases) |

**Note:** Free tier gives 100 credits/month. A moderately active lawyer would need ~200 credits/month with agents enabled. This naturally drives upgrade to paid credit packs.

---

## Testing

1. **Daily Briefing:** Create user with cases + hearings today → run `php artisan agent:daily-briefing` manually → verify notification + email
2. **Hearing Prep:** Create case with hearing tomorrow → run `php artisan agent:hearing-prep` → verify prep brief quality
3. **Case Intake:** Start intake session → send messages through each step → verify case created with correct data
4. **Credit deduction:** Verify credits consumed appear in ledger, partial runs save results
5. **Preferences:** Disable agent → verify it doesn't run for that user
6. **Language:** Test all agents in Bengali — verify prompts produce BN output
