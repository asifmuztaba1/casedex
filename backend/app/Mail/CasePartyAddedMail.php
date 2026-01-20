<?php

namespace App\Mail;

use App\Domain\Cases\Models\CaseFile;
use App\Domain\Cases\Models\CaseParty;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class CasePartyAddedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly CaseFile $case,
        public readonly CaseParty $party,
        public readonly ?User $actor
    ) {
    }

    public function build(): self
    {
        return $this->subject('You have been added to a case')
            ->text('emails.case-party-added')
            ->with([
                'case' => $this->case,
                'party' => $this->party,
                'actor' => $this->actor,
            ]);
    }
}
