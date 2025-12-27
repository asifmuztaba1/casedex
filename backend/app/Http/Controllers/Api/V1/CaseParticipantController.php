<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Cases\Actions\AddCaseParticipantAction;
use App\Domain\Cases\Actions\FindCaseAction;
use App\Domain\Cases\Actions\ListCaseParticipantsAction;
use App\Domain\Cases\Actions\RemoveCaseParticipantAction;
use App\Domain\Cases\Models\CaseParticipant;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\StoreCaseParticipantRequest;
use App\Http\Resources\Api\V1\CaseParticipantResource;
use Illuminate\Http\Request;

class CaseParticipantController extends Controller
{
    public function index(
        string $casePublicId,
        FindCaseAction $findCase,
        ListCaseParticipantsAction $action
    ) {
        $case = $findCase->handle($casePublicId);

        $this->authorize('viewAny', [CaseParticipant::class, $case]);

        $participants = $action->handle($case->id);

        return CaseParticipantResource::collection($participants);
    }

    public function store(
        string $casePublicId,
        StoreCaseParticipantRequest $request,
        FindCaseAction $findCase,
        AddCaseParticipantAction $action
    ) {
        $case = $findCase->handle($casePublicId);

        $this->authorize('create', [CaseParticipant::class, $case]);

        $participant = $action->handle($case->id, $request->validated(), $request->user());

        return new CaseParticipantResource($participant->load('user'));
    }

    public function destroy(
        string $casePublicId,
        int $participantId,
        Request $request,
        FindCaseAction $findCase,
        RemoveCaseParticipantAction $action
    ) {
        $case = $findCase->handle($casePublicId);

        $participant = CaseParticipant::query()
            ->where('case_id', $case->id)
            ->where('id', $participantId)
            ->firstOrFail();

        $this->authorize('delete', $participant);

        $action->handle($participant, $request->user());

        return response()->noContent();
    }
}
