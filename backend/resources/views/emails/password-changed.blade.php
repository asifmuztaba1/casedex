@extends('emails.layouts.base', ['subject' => __('emails.password_changed_subject')])

@section('content')
<p style="margin:0 0 12px;">{{ __('emails.hello', ['name' => $user->name]) }}</p>
<p style="margin:0 0 12px;">{{ __('emails.password_changed_intro') }}</p>
<p style="margin:0 0 8px;"><strong>{{ __('emails.label_time') }}:</strong> {{ $changedAt }}</p>
<p style="margin:0 0 16px;"><strong>{{ __('emails.label_ip') }}:</strong> {{ $ipAddress }}</p>
<p style="margin:0;color:#475569;">{{ __('emails.password_changed_outro') }}</p>
@endsection
