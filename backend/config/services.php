<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    // Web Push (VAPID). Generate once per environment:
    // php -r "require 'vendor/autoload.php'; print_r(Minishlink\WebPush\VAPID::createVapidKeys());"
    // The public key must also be set as NEXT_PUBLIC_VAPID_PUBLIC_KEY for the frontend build.
    // Native mobile apps: per-device Sanctum tokens. See docs/mobile-api.md.
    'mobile' => [
        'token_ttl_days' => (int) env('MOBILE_TOKEN_TTL_DAYS', 60),
    ],

    // Firebase Cloud Messaging (HTTP v1) for mobile push. FCM_CREDENTIALS is
    // the service-account JSON itself or a path to it. Without both values
    // nothing is sent.
    'fcm' => [
        'project_id' => env('FCM_PROJECT_ID'),
        'credentials' => env('FCM_CREDENTIALS'),
    ],

    'webpush' => [
        'public_key' => env('VAPID_PUBLIC_KEY'),
        'private_key' => env('VAPID_PRIVATE_KEY'),
        'subject' => env('VAPID_SUBJECT', 'mailto:support@casedex.app'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'whatsapp' => [
        'driver' => env('WHATSAPP_DRIVER', 'null'),
        'access_token' => env('WHATSAPP_ACCESS_TOKEN'),
        'phone_number_id' => env('WHATSAPP_PHONE_NUMBER_ID'),
        'daily_briefing_template' => env('WHATSAPP_DAILY_BRIEFING_TEMPLATE'),
    ],

    'ai' => [
        'driver' => env('AI_DRIVER', 'openai_compatible'),
        'base_url' => env('AI_BASE_URL', 'https://api.openai.com/v1'),
        'gemini_base_url' => env('AI_GEMINI_BASE_URL', 'https://generativelanguage.googleapis.com/v1beta'),
        'api_key' => env('AI_API_KEY')
            ?: env('AI_OPENAI_API_KEY')
            ?: env('GROQ_API_KEY'),
        'gemini_api_key' => env('AI_GEMINI_API_KEY')
            ?: env('GEMINI_API_KEY')
            ?: env('GOOGLE_API_KEY')
            ?: env('AI_API_KEY'),
        'model' => env('AI_MODEL', 'gpt-4.1-mini'),
        // Google retires pinned versions (gemini-2.0-flash returns 404 now); the
        // -latest alias tracks the current Flash model.
        'gemini_model' => env('AI_GEMINI_MODEL', 'gemini-flash-latest'),
    ],

];
