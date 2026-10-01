@extends('emails.layouts.base', ['subject' => __('emails.invite_subject')])

@section('content')
<p style="margin:0 0 12px;">{{ __('emails.hello', ['name' => $user->name]) }}</p>
<p style="margin:0 0 12px;">{{ __('emails.invite_intro') }}</p>
<p style="margin:0 0 8px;"><strong>{{ __('emails.label_temp_password') }}:</strong> {{ $temporaryPassword }}</p>
<p style="margin:0 0 20px;">
  <a href="{{ $loginUrl }}" style="display:inline-block;padding:10px 16px;background:#0f2a56;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;">{{ __('emails.invite_button') }}</a>
</p>
<p style="margin:0;color:#475569;">{{ __('emails.invite_outro') }}</p>
@endsection
