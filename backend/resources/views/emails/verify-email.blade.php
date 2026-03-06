@extends('emails.layouts.base', ['subject' => 'Verify your CaseDex email'])

@section('content')
<p style="margin:0 0 12px;">Hello {{ $user->name }},</p>
<p style="margin:0 0 16px;">Please verify your email address to secure your CaseDex account.</p>
<p style="margin:0 0 20px;">
  <a href="{{ $verificationUrl }}" style="display:inline-block;padding:10px 16px;background:#0f2a56;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;">Verify email</a>
</p>
<p style="margin:0;color:#475569;">If you did not create this account, you can ignore this message.</p>
@endsection
