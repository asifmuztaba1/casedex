<?php

namespace App\Domain\Voice\Actions;

use App\Domain\Voice\Services\AssociateAgentDefinition;
use App\Domain\Voice\Services\ElevenLabsClient;
use App\Domain\Voice\Services\VoiceSettings;
use App\Models\User;
use Illuminate\Support\Facades\Log;

/**
 * Creates the junior associate in ElevenLabs, or updates it to match
 * AssociateAgentDefinition. Tools are recreated each time and the old ones
 * removed, so the agent never runs stale tool definitions.
 */
class SyncAssociateAgentAction
{
    public function __construct(
        private readonly VoiceSettings $settings,
        private readonly ElevenLabsClient $elevenLabs,
    ) {
    }

    public function handle(User $admin): string
    {
        $oldToolIds = $this->settings->associateToolIds();
        $toolIds = array_map(fn (array $tool): string => $this->elevenLabs->createTool($tool), AssociateAgentDefinition::tools());
        $config = AssociateAgentDefinition::agentConfig($toolIds);

        $agentId = $this->settings->associateAgentId();
        if ($agentId === null) {
            $agentId = $this->elevenLabs->createAgent($config);
        } else {
            $this->elevenLabs->updateAgent($agentId, $config);
        }

        $this->settings->saveAssociate($agentId, $toolIds, $admin->id);
        foreach ($oldToolIds as $oldToolId) {
            $this->elevenLabs->deleteTool($oldToolId);
        }

        Log::info('voice.associate_synced', ['agent_id' => $agentId, 'tools' => count($toolIds), 'admin_user_id' => $admin->id]);

        return $agentId;
    }
}
