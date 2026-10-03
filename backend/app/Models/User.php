<?php

namespace App\Models;

use App\Domain\Auth\Actions\RevokeDeviceTokensAction;
use App\Domain\Auth\Enums\UserRole;
use App\Domain\Auth\Models\DeviceToken;
use App\Domain\Tenancy\Models\Country;
use App\Domain\Tenancy\Models\Tenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\Access\Authorizable;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Auth\MustVerifyEmail;
use Illuminate\Contracts\Auth\MustVerifyEmail as MustVerifyEmailContract;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\URL;
use App\Mail\VerifyEmailMail;
use App\Mail\PasswordResetMail;

class User extends Authenticatable implements MustVerifyEmailContract
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, Notifiable, MustVerifyEmail, Authorizable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'tenant_id',
        'country_id',
        'locale',
        'public_id',
        'role',
        'whatsapp_phone',
        'whatsapp_opted_in',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'deletion_requested_at' => 'datetime',
            'deletion_scheduled_for' => 'datetime',
            'anonymised_at' => 'datetime',
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'role' => UserRole::class,
            'whatsapp_opted_in' => 'boolean',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (self $user): void {
            if ($user->public_id === null) {
                $user->public_id = (string) Str::ulid();
            }
        });

        // Every password change path (reset link, profile, an admin editing a
        // member) signs the user out of their phones, except the phone that
        // made the change.
        static::updated(function (self $user): void {
            if (! $user->wasChanged('password')) {
                return;
            }

            $current = auth()->user()?->currentAccessToken();
            $keep = $current instanceof DeviceToken && (int) $current->tokenable_id === $user->id ? $current : null;

            app(RevokeDeviceTokensAction::class)->handle($user, $keep, 'password_changed');
        });
    }

    /** Asked to delete the account; erased on deletion_scheduled_for unless they sign in first. */
    public function isDeletionPending(): bool
    {
        return $this->deletion_requested_at !== null && $this->anonymised_at === null;
    }

    public function isAnonymised(): bool
    {
        return $this->anonymised_at !== null;
    }

    /** Whether notifications (email, WhatsApp) may still be sent to this person. */
    public function canReceiveMessages(): bool
    {
        return ! $this->isDeletionPending() && ! $this->isAnonymised();
    }

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function country()
    {
        return $this->belongsTo(Country::class);
    }

    public function sendEmailVerificationNotification(): void
    {
        $url = URL::temporarySignedRoute(
            'auth.verify-email',
            now()->addMinutes(60),
            [
                'id' => $this->id,
                'hash' => sha1($this->getEmailForVerification()),
            ]
        );

        Mail::to($this->email)->queue(new VerifyEmailMail($this, $url));
    }

    public function sendPasswordResetNotification($token): void
    {
        $frontendUrl = rtrim(config('app.frontend_url'), '/');
        $resetUrl = sprintf(
            '%s/reset-password?token=%s&email=%s',
            $frontendUrl,
            urlencode((string) $token),
            urlencode($this->email)
        );

        Mail::to($this->email)->queue(new PasswordResetMail($this, $resetUrl));
    }
}
