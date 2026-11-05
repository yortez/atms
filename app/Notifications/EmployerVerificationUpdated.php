<?php

namespace App\Notifications;

use Illuminate\Notifications\Notification;

class EmployerVerificationUpdated extends Notification
{
    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * @return array<string, string>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'title' => 'Company verification updated',
            'message' => 'Your company verification status is '.$this->status.'.',
        ];
    }

    public function __construct(private readonly string $status) {}
}
