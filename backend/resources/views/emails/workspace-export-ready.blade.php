@extends('emails.layouts.base', ['subject' => __('emails.export_ready_subject')])

@section('content')
<p style="margin:0 0 12px;">{{ __('emails.hello', ['name' => $user->name]) }}</p>
<p style="margin:0 0 16px;">{{ __('emails.export_ready_intro', ['workspace' => $workspaceName]) }}</p>
<p style="margin:0 0 16px;">
  <a href="{{ $downloadUrl }}" style="display:inline-block;padding:10px 16px;background:#0f2a56;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;">{{ __('emails.export_ready_button') }}</a>
</p>
@if ($expiresOn)
<p style="margin:0 0 12px;">{{ __('emails.export_ready_expires', ['date' => $expiresOn]) }}</p>
@endif
<p style="margin:0;color:#475569;">{{ __('emails.export_ready_outro') }}</p>
@endsection
