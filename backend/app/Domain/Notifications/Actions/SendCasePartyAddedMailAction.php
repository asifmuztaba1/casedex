<?php

namespace App\Domain\Notifications\Actions;

use App\Domain\Cases\Models\CaseFile;
use App\Domain\Cases\Models\CaseParty;
use App\Mail\CasePartyAddedMail;
use App\Models\User;
use Illuminate\Support\Facades\Mail;

class SendCasePartyAddedMailAction
{
    public function handle(CaseFile $case, CaseParty $party, ?User $actor): void
    {
        if (empty($party->email)) {
            return;
        }

        Mail::to($party->email)->queue(new CasePartyAddedMail($case, $party, $actor));
    }
}
