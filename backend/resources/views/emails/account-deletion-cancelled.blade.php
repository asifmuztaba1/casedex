@extends('emails.layouts.base', ['subject' => __('emails.deletion_cancelled_subject')])

@section('content')
<p style="margin:0 0 12px;">{{ __('emails.hello', ['name' => $user->name]) }}</p>
<p style="margin:0 0 12px;">{{ __('emails.deletion_cancelled_intro') }}</p>
<p style="margin:0;color:#475569;">{{ __('emails.deletion_cancelled_outro') }}</p>
@endsection
