<?php

namespace App\Mail;

use App\Models\User;
use App\Support\LocalizedDate;
use Carbon\CarbonInterface;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class WorkspaceExportReadyMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly User $user,
        public readonly string $workspaceName,
        public readonly string $downloadUrl,
        public readonly ?CarbonInterface $expiresAt
    ) {
        $this->locale(in_array($this->user->locale, ['en', 'bn'], true) ? $this->user->locale : config('app.locale'));
    }

    public function build(): self
    {
        return $this->subject(__('emails.export_ready_subject'))
            ->view('emails.workspace-export-ready')
            ->with([
                'user' => $this->user,
                'workspaceName' => $this->workspaceName,
                'downloadUrl' => $this->downloadUrl,
                'expiresOn' => $this->expiresAt ? LocalizedDate::date($this->expiresAt, $this->locale) : null,
            ]);
    }
}
