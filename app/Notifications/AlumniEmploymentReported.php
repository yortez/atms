<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class AlumniEmploymentReported extends Notification
{
    use Queueable;

    public function __construct(private readonly int $recordId) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * @return array<string, int|string>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'title' => 'Employment information saved',
            'message' => 'Your employment tracer update has been recorded.',
            'employment_record_id' => $this->recordId,
        ];
    }
}
