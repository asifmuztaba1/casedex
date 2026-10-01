<?php

namespace App\Mail;

use App\Domain\Cases\Models\CaseFile;
use App\Domain\Cases\Models\CaseParty;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use App\Support\TenantContext;

class CasePartyAddedMail extends Mailable
{
    use Queueable;
    use SerializesModels {
        __unserialize as restoreSerializedModels;
    }

    public int $tenantId;

    public function __construct(
        public readonly CaseFile $case,
        public readonly CaseParty $party,
        public readonly ?User $actor
    ) {
        $this->tenantId = (int) $case->tenant_id;
        // The party is outside the firm and has no profile; write in the sender's language.
        $this->locale(in_array($actor?->locale, ['en', 'bn'], true) ? $actor->locale : config('app.locale'));
    }

    /**
     * Queue workers restore the case and party (tenant-scoped models) with no
     * request tenant, so restore them inside this mail's tenant context.
     *
     * @param  array<string, mixed>  $values
     */
    public function __unserialize(array $values): void
    {
        TenantContext::set((int) $values['tenantId']);

        try {
            $this->restoreSerializedModels($values);
        } finally {
            TenantContext::clear();
        }
    }

    public function build(): self
    {
        return $this->subject(__('emails.party_added_subject'))
            ->view('emails.case-party-added')
            ->with([
                'case' => $this->case,
                'party' => $this->party,
                'actor' => $this->actor,
            ]);
    }
}
