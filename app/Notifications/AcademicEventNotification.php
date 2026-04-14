<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class AcademicEventNotification extends Notification
{
    use Queueable;

    /**
     * @param  array<string, mixed>  $metadata
     */
    public function __construct(
        private readonly string $title,
        private readonly string $body,
        private readonly string $category,
        private readonly ?string $actionUrl = null,
        private readonly array $metadata = [],
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * @return array<string, mixed>
     */
    public function toDatabase(object $notifiable): array
    {
        return [
            'title' => $this->title,
            'body' => $this->body,
            'category' => $this->category,
            'action_url' => $this->actionUrl,
            ...$this->metadata,
        ];
    }
}
