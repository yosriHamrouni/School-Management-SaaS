<?php

namespace App\Services;

use App\Events\MessageSent;
use App\Models\Message;
use App\Models\User;
use App\Notifications\InternalMessageNotification;
use Illuminate\Support\Collection;

class MessagingService
{
    public function buildConversationKey(int $firstUserId, int $secondUserId): string
    {
        $pair = [$firstUserId, $secondUserId];
        sort($pair);

        return implode(':', $pair);
    }

    public function send(User $sender, User $receiver, string $content): Message
    {
        $message = Message::query()->create([
            'establishment_id' => $sender->establishment_id,
            'sender_id' => $sender->id,
            'receiver_id' => $receiver->id,
            'conversation_key' => $this->buildConversationKey($sender->id, $receiver->id),
            'content' => trim($content),
        ]);

        $message->loadMissing(['sender:id,name', 'receiver:id,name']);
        $receiver->notify(new InternalMessageNotification($message));
        event(new MessageSent($message));

        return $message;
    }

    /**
     * @return Collection<int, Message>
     */
    public function messagesForConversation(User $user, User $participant): Collection
    {
        return Message::query()
            ->with(['sender:id,name', 'receiver:id,name'])
            ->where('establishment_id', $user->establishment_id)
            ->where('conversation_key', $this->buildConversationKey($user->id, $participant->id))
            ->orderBy('created_at')
            ->orderBy('id')
            ->get();
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    public function conversationsFor(User $user): Collection
    {
        $messages = Message::query()
            ->with(['sender:id,name', 'sender.roles:id,name', 'receiver:id,name', 'receiver.roles:id,name'])
            ->where('establishment_id', $user->establishment_id)
            ->where(fn ($query) => $query
                ->where('sender_id', $user->id)
                ->orWhere('receiver_id', $user->id))
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->get();

        return $messages
            ->groupBy(fn (Message $message) => $message->sender_id === $user->id ? $message->receiver_id : $message->sender_id)
            ->map(function (Collection $conversationMessages) use ($user) {
                /** @var Message $latestMessage */
                $latestMessage = $conversationMessages->first();
                $participant = $latestMessage->sender_id === $user->id
                    ? $latestMessage->receiver
                    : $latestMessage->sender;

                return [
                    'participant' => [
                        'id' => $participant?->id,
                        'name' => $participant?->name,
                        'roles' => $participant?->roles?->pluck('name')->values()->all() ?? [],
                    ],
                    'last_message' => [
                        'id' => $latestMessage->id,
                        'content' => $latestMessage->content,
                        'created_at' => $latestMessage->created_at?->toIso8601String(),
                        'sender_id' => $latestMessage->sender_id,
                        'read_at' => $latestMessage->read_at?->toIso8601String(),
                    ],
                    'unread_count' => $conversationMessages
                        ->where('receiver_id', $user->id)
                        ->whereNull('read_at')
                        ->count(),
                ];
            })
            ->sortByDesc(fn (array $conversation) => $conversation['last_message']['created_at'])
            ->values();
    }

    public function markConversationAsRead(User $user, User $participant): int
    {
        $updated = Message::query()
            ->where('establishment_id', $user->establishment_id)
            ->where('sender_id', $participant->id)
            ->where('receiver_id', $user->id)
            ->whereNull('read_at')
            ->update(['read_at' => now(), 'updated_at' => now()]);

        $user->unreadNotifications
            ->filter(fn ($notification) => ($notification->data['category'] ?? null) === 'message')
            ->filter(fn ($notification) => (int) ($notification->data['sender_id'] ?? 0) === $participant->id)
            ->filter(fn ($notification) => (int) ($notification->data['establishment_id'] ?? 0) === (int) $user->establishment_id)
            ->each
            ->markAsRead();

        return $updated;
    }
}
