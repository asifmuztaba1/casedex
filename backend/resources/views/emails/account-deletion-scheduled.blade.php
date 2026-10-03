@extends('emails.layouts.base', ['subject' => __('emails.deletion_scheduled_subject')])

@section('content')
<p style="margin:0 0 12px;">{{ __('emails.hello', ['name' => $user->name]) }}</p>
<p style="margin:0 0 12px;">{{ __('emails.deletion_scheduled_intro', ['date' => $deleteOn]) }}</p>
@if ($workspaceWillBeDeleted)
<p style="margin:0 0 12px;">{{ __('emails.deletion_scheduled_workspace') }}</p>
@endif
<p style="margin:0 0 16px;">{{ __('emails.deletion_scheduled_cancel') }}</p>
<p style="margin:0 0 16px;">
  <a href="{{ $signInUrl }}" style="display:inline-block;padding:10px 16px;background:#0f2a56;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;">{{ __('emails.deletion_scheduled_button') }}</a>
</p>
<p style="margin:0;color:#475569;">{{ __('emails.deletion_scheduled_outro') }}</p>
@endsection
