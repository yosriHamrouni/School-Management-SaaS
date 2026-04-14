<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Notifications\DatabaseNotification;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Support\Collection;

class NotificationCenterService
{
    public function unreadCountFor(User $user): int
    {
        return $this->queryFor($user)
            ->whereNull('read_at')
            ->count();
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    public function recentFor(User $user, int $limit = 5): Collection
    {
        return $this->queryFor($user)
            ->latest()
            ->limit($limit)
            ->get()
            ->map(fn (DatabaseNotification $notification) => $this->format($notification))
            ->values();
    }

    public function paginateFor(User $user, int $perPage = 20): LengthAwarePaginator
    {
        return $this->queryFor($user)
            ->latest()
            ->paginate($perPage)
            ->withQueryString()
            ->through(fn (DatabaseNotification $notification) => $this->format($notification));
    }

    /**
     * @return array<string, mixed>
     */
    public function format(DatabaseNotification $notification): array
    {
        return [
            'id' => $notification->id,
            'title' => $notification->data['title'] ?? 'Notification',
            'body' => $notification->data['body'] ?? null,
            'category' => $notification->data['category'] ?? 'general',
            'action_url' => $notification->data['action_url'] ?? null,
            'read_at' => $notification->read_at?->toIso8601String(),
            'created_at' => $notification->created_at?->toIso8601String(),
        ];
    }

    private function queryFor(User $user): MorphMany
    {
        return $user->notifications()
            ->where(function ($query) use ($user) {
                $query
                    ->whereRaw("(data::jsonb ->> 'establishment_id') is null")
                    ->orWhereRaw(
                        "(data::jsonb ->> 'establishment_id') = ?",
                        [(string) $user->establishment_id],
                    );
            });
    }
}
