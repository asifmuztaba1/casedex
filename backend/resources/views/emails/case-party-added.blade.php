@extends('emails.layouts.base', ['subject' => __('emails.party_added_subject')])

@section('content')
<p style="margin:0 0 12px;">{{ __('emails.hello', ['name' => $party->name]) }}</p>
<p style="margin:0 0 12px;">{{ __('emails.party_added_intro') }}</p>
<p style="margin:0 0 6px;"><strong>{{ __('emails.label_case') }}:</strong> {{ $case->title }}</p>
<p style="margin:0 0 6px;"><strong>{{ __('emails.label_court') }}:</strong> {{ $case->court ?? __('emails.value_tbd') }}</p>
<p style="margin:0 0 6px;"><strong>{{ __('emails.label_case_number') }}:</strong> {{ $case->case_number ?? __('emails.value_pending') }}</p>
<p style="margin:0 0 16px;"><strong>{{ __('emails.label_added_by') }}:</strong> {{ $actor?->name ?? __('emails.value_team') }}</p>
<p style="margin:0;color:#475569;">{{ __('emails.party_added_outro') }}</p>
@endsection
