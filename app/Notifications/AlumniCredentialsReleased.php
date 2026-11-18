<?php

namespace App\Notifications;

use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AlumniCredentialsReleased extends Notification
{
    public function __construct(
        public readonly string $recipientName,
        public readonly string $username,
        public readonly string $password,
        public readonly int $referenceId,
        public readonly ?string $reviewNote = null,
    ) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $mail = (new MailMessage)
            ->subject("Your SEAIT Alumni Portal Login Credentials (Request #{$this->referenceId})")
            ->greeting("Hello {$this->recipientName},")
            ->line('Your alumni record assistance request has been verified and approved.')
            ->line("Username: {$this->username}")
            ->line("Password: {$this->password}");

        if (filled($this->reviewNote)) {
            $mail->line("Coordinator Note: {$this->reviewNote}");
        }

        return $mail
            ->action('Sign In to SEAIT Alumni Portal', url('/login'))
            ->line('For your security, please update your password after signing in.');
    }
}

