<?php

namespace App\Http\Controllers;

use App\Services\NotificationCenterService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Notifications\DatabaseNotification;
use Inertia\Inertia;
use Inertia\Response;

class NotificationController extends Controller
{
    public function __construct(
        private readonly NotificationCenterService $notificationCenter,
    ) {
    }

    public function index(Request $request): Response
    {
        $this->authorize('viewAny', DatabaseNotification::class);

        $notifications = $this->notificationCenter->paginateFor($request->user());

        return Inertia::render('Notifications/Index', [
            'notifications' => $notifications,
            'unreadCount' => $this->notificationCenter->unreadCountFor($request->user()),
        ]);
    }

    public function update(Request $request, DatabaseNotification $notification): RedirectResponse
    {
        $this->authorize('update', $notification);

        if ($notification->read_at === null) {
            $notification->markAsRead();
        }

        return redirect()->back()->with('success', 'Notification marquee comme lue.');
    }
}
