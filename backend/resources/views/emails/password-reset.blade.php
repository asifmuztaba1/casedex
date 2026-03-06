@extends('emails.layouts.base', ['subject' => 'Reset your CaseDex password'])

@section('content')
<p style="margin:0 0 12px;">Hello {{ $user->name }},</p>
<p style="margin:0 0 16px;">We received a password reset request for your account.</p>
<p style="margin:0 0 20px;">
  <a href="{{ $resetUrl }}" style="display:inline-block;padding:10px 16px;background:#0f2a56;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;">Reset password</a>
</p>
<p style="margin:0;color:#475569;">If this was not you, ignore this email and your password will remain unchanged.</p>
@endsection
