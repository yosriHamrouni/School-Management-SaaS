<?php

namespace App\Policies;

use App\Models\Message;
use App\Models\User;
use App\Services\MessagingPermissionService;

class MessagePolicy
{
    public function viewAny(User $user): bool
    {
        return app(MessagingPermissionService::class)->canAccessMessagingWorkspace($user);
    }

    public function viewConversation(User $user, User $participant): bool
    {
        return app(MessagingPermissionService::class)->canMessage($user, $participant);
    }

    public function create(User $user, User $recipient): bool
    {
        return app(MessagingPermissionService::class)->canMessage($user, $recipient);
    }

    public function markAsRead(User $user, User $participant): bool
    {
        return app(MessagingPermissionService::class)->canMessage($user, $participant);
    }
}
