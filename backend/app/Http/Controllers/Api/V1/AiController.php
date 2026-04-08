<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Ai\Actions\EnqueueAiRequestAction;
use App\Domain\Ai\Enums\AiFeature;
use App\Domain\Ai\Models\AiRequest;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\StoreAiRequest;
use App\Http\Resources\Api\V1\AiRequestResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AiController extends Controller
{
    public function hearingSummary(StoreAiRequest $request, EnqueueAiRequestAction $action): JsonResponse
    {
        return $this->enqueue($request, $action, AiFeature::HearingSummary, ['content']);
    }

    public function diarySummary(StoreAiRequest $request, EnqueueAiRequestAction $action): JsonResponse
    {
        return $this->enqueue($request, $action, AiFeature::DiarySummary, ['content']);
    }

    public function researchSummary(StoreAiRequest $request, EnqueueAiRequestAction $action): JsonResponse
    {
        return $this->enqueue($request, $action, AiFeature::ResearchSummary, ['content']);
    }

    public function documentQa(StoreAiRequest $request, EnqueueAiRequestAction $action): JsonResponse
    {
        return $this->enqueue($request, $action, AiFeature::DocumentQa, ['question', 'context']);
    }

    public function petitionDraft(StoreAiRequest $request, EnqueueAiRequestAction $action): JsonResponse
    {
        return $this->enqueue($request, $action, AiFeature::PetitionDraft, [
            'case_type', 'court_name', 'facts', 'relief_sought', 'sections',
            'client_name', 'opponent_name', 'language',
        ]);
    }

    public function legalSectionLookup(StoreAiRequest $request, EnqueueAiRequestAction $action): JsonResponse
    {
        return $this->enqueue($request, $action, AiFeature::LegalSectionLookup, ['content', 'language']);
    }

    public function caseLawSuggestion(StoreAiRequest $request, EnqueueAiRequestAction $action): JsonResponse
    {
        return $this->enqueue($request, $action, AiFeature::CaseLawSuggestion, ['content', 'language']);
    }

    public function nextSteps(StoreAiRequest $request, EnqueueAiRequestAction $action): JsonResponse
    {
        return $this->enqueue($request, $action, AiFeature::NextSteps, [
            'case_title', 'case_status', 'content', 'language',
        ]);
    }

    public function clientCommunication(StoreAiRequest $request, EnqueueAiRequestAction $action): JsonResponse
    {
        return $this->enqueue($request, $action, AiFeature::ClientCommunication, [
            'case_title', 'content', 'client_name', 'tone', 'language',
        ]);
    }

    public function show(Request $request, string $publicId): JsonResponse
    {
        $aiRequest = AiRequest::query()->where('public_id', $publicId)->firstOrFail();

        return response()->json([
            'data' => new AiRequestResource($aiRequest),
        ]);
    }

    /**
     * @param array<int, string> $allowedFields
     */
    private function enqueue(
        StoreAiRequest $request,
        EnqueueAiRequestAction $action,
        AiFeature $feature,
        array $allowedFields
    ): JsonResponse {
        $validated = $request->validated();

        $payload = [];
        foreach ($allowedFields as $field) {
            if (array_key_exists($field, $validated) && $validated[$field] !== null) {
                $payload[$field] = $validated[$field];
            }
        }

        if ($payload === []) {
            abort(422, 'Missing AI payload content.');
        }

        $aiRequest = $action->handle(
            $request->user()->tenant,
            $request->user(),
            $feature,
            (string) $validated['idempotency_key'],
            $payload
        );

        return response()->json([
            'data' => new AiRequestResource($aiRequest),
        ], 202);
    }
}
