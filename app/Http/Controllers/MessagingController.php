<?php

namespace App\Http\Controllers;

use App\Http\Requests\Messaging\StoreMessageRequest;
use App\Models\Message;
use App\Models\User;
use App\Services\MessagingPermissionService;
use App\Services\MessagingService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class MessagingController extends Controller
{
    public function __construct(
        private readonly MessagingPermissionService $permissionService,
        private readonly MessagingService $messagingService,
    ) {
    }

    public function index(Request $request, ?User $participant = null): Response
    {
        $user = $request->user();
        $this->authorize('viewAny', Message::class);

        $conversations = $this->messagingService->conversationsFor($user);
        $selectedParticipant = $participant;

        if ($selectedParticipant !== null) {
            $selectedParticipant->loadMissing('roles:id,name');
            $this->authorize('viewConversation', [Message::class, $selectedParticipant]);
        } elseif ($conversations->isNotEmpty()) {
            $selectedParticipantId = $conversations->first()['participant']['id'] ?? null;
            $selectedParticipant = $selectedParticipantId
                ? User::query()->with('roles:id,name')->find($selectedParticipantId)
                : null;
        }

        $messages = $selectedParticipant
            ? $this->messagingService->messagesForConversation($user, $selectedParticipant)
            : collect();

        return Inertia::render('Messaging/Index', [
            'conversations' => $conversations,
            'selectedConversation' => $selectedParticipant ? [
                'participant' => [
                    'id' => $selectedParticipant->id,
                    'name' => $selectedParticipant->name,
                    'roles' => $selectedParticipant->roles->pluck('name')->values()->all(),
                ],
                'messages' => $messages->map(fn ($message) => [
                    'id' => $message->id,
                    'content' => $message->content,
                    'created_at' => $message->created_at?->toIso8601String(),
                    'read_at' => $message->read_at?->toIso8601String(),
                    'sender' => [
                        'id' => $message->sender?->id,
                        'name' => $message->sender?->name,
                    ],
                    'receiver' => [
                        'id' => $message->receiver?->id,
                        'name' => $message->receiver?->name,
                    ],
                ])->values(),
            ] : null,
            'recipientOptions' => $this->permissionService->availableRecipients($user)
                ->map(fn (User $recipient) => [
                    'id' => $recipient->id,
                    'name' => $recipient->name,
                    'roles' => $recipient->roles->pluck('name')->values()->all(),
                ])
                ->values(),
        ]);
    }

    public function store(StoreMessageRequest $request): RedirectResponse
    {
        $sender = $request->user();
        $receiver = User::query()->findOrFail($request->integer('receiver_id'));
        $this->authorize('create', [Message::class, $receiver]);

        DB::transaction(fn () => $this->messagingService->send(
            sender: $sender,
            receiver: $receiver,
            content: (string) $request->string('content'),
        ));

        return redirect()
            ->route('messaging.show', ['participant' => $receiver->id])
            ->with('success', 'Message envoye.');
    }

    public function markConversationAsRead(Request $request, User $participant): RedirectResponse
    {
        $this->authorize('markAsRead', [Message::class, $participant]);

        $this->messagingService->markConversationAsRead($request->user(), $participant);

        return redirect()
            ->route('messaging.show', ['participant' => $participant->id])
            ->with('success', 'Conversation marquee comme lue.');
    }
}
