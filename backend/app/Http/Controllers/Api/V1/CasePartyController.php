<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Cases\Actions\AddCasePartyAction;
use App\Domain\Cases\Actions\FindCaseAction;
use App\Domain\Cases\Actions\ListCasePartiesAction;
use App\Domain\Cases\Actions\RemoveCasePartyAction;
use App\Domain\Cases\Actions\UpdateCasePartyAction;
use App\Domain\Cases\Models\CaseParty;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\StoreCasePartyRequest;
use App\Http\Requests\Api\V1\UpdateCasePartyRequest;
use App\Http\Resources\Api\V1\CasePartyResource;
use Illuminate\Http\Request;

class CasePartyController extends Controller
{
    public function index(
        string $casePublicId,
        FindCaseAction $findCase,
        ListCasePartiesAction $action
    ) {
        $case = $findCase->handle($casePublicId);

        $this->authorize('viewAny', [CaseParty::class, $case]);

        $parties = $action->handle($case->id);

        return CasePartyResource::collection($parties);
    }

    public function store(
        string $casePublicId,
        StoreCasePartyRequest $request,
        FindCaseAction $findCase,
        AddCasePartyAction $action
    ) {
        $case = $findCase->handle($casePublicId);

        $this->authorize('create', [CaseParty::class, $case]);

        $party = $action->handle($case, $request->validated(), $request->user());

        return new CasePartyResource($party);
    }

    public function update(
        string $casePublicId,
        int $partyId,
        UpdateCasePartyRequest $request,
        FindCaseAction $findCase,
        UpdateCasePartyAction $action
    ) {
        $case = $findCase->handle($casePublicId);

        $party = CaseParty::query()
            ->where('case_id', $case->id)
            ->where('id', $partyId)
            ->firstOrFail();

        $this->authorize('update', $party);

        $party = $action->handle($party, $request->validated(), $request->user());

        return new CasePartyResource($party);
    }

    public function destroy(
        string $casePublicId,
        int $partyId,
        Request $request,
        FindCaseAction $findCase,
        RemoveCasePartyAction $action
    ) {
        $case = $findCase->handle($casePublicId);

        $party = CaseParty::query()
            ->where('case_id', $case->id)
            ->where('id', $partyId)
            ->firstOrFail();

        $this->authorize('delete', $party);

        $action->handle($party, $request->user());

        return response()->noContent();
    }
}
