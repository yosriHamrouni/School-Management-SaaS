<?php

namespace App\Http\Middleware;

use App\Services\NotificationCenterService;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    public function __construct(
        private readonly NotificationCenterService $notificationCenter,
    ) {
    }

    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),

            'auth' => [
                'user' => $request->user()
                    ? [
                        'id' => $request->user()->id,
                        'name' => $request->user()->name,
                        'email' => $request->user()->email,
                        'email_verified_at' => $request->user()->email_verified_at,
                        'establishment' => $request->user()->establishment
                            ? [
                                'id' => $request->user()->establishment->id,
                                'name' => $request->user()->establishment->name,
                                'email' => $request->user()->establishment->email,
                            ]
                            : null,
                        'roles' => $request->user()->roles->map(function ($role) {
                            return [
                                'id' => $role->id,
                                'name' => $role->name,
                                'description' => $role->description,
                            ];
                        })->values(),
                    ]
                    : null,
            ],
            'flash' => [
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
            ],
            'locale' => app()->getLocale(),
            'notificationCenter' => $request->user()
                ? [
                    'unread_count' => $this->notificationCenter->unreadCountFor($request->user()),
                    'recent' => $this->notificationCenter->recentFor($request->user()),
                ]
                : [
                    'unread_count' => 0,
                    'recent' => [],
                ],
        ];
    }
}
