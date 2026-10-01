@extends('emails.layouts.base', ['subject' => __('emails.reset_subject')])

@section('content')
<p style="margin:0 0 12px;">{{ __('emails.hello', ['name' => $user->name]) }}</p>
<p style="margin:0 0 16px;">{{ __('emails.reset_intro') }}</p>
<p style="margin:0 0 20px;">
  <a href="{{ $resetUrl }}" style="display:inline-block;padding:10px 16px;background:#0f2a56;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;">{{ __('emails.reset_button') }}</a>
</p>
<p style="margin:0;color:#475569;">{{ __('emails.reset_outro') }}</p>
@endsection
