<?php

namespace App\Notifications;

use App\Models\Message;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class InternalMessageNotification extends Notification
{
    use Queueable;

    public function __construct(
        private readonly Message $message,
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
        $sender = $this->message->sender;

        return [
            'title' => 'Nouveau message interne',
            'body' => $sender?->name
                ? "{$sender->name} vous a envoye un nouveau message."
                : 'Vous avez recu un nouveau message interne.',
            'category' => 'message',
            'action_url' => route('messaging.show', ['participant' => $this->message->sender_id]),
            'message_id' => $this->message->id,
            'sender_id' => $this->message->sender_id,
            'sender_name' => $sender?->name,
            'establishment_id' => $this->message->establishment_id,
        ];
    }
}
