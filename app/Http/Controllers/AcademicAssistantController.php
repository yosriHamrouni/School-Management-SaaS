<?php

namespace App\Http\Controllers;

use App\Models\ChatConversation;
use App\Services\AcademicAssistant\AcademicAssistantService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class AcademicAssistantController extends Controller
{
    public function index(Request $request): Response
    {
        $conversations = $this->conversationQuery($request)
            ->with(['messages' => fn ($query) => $query->latest()->limit(1)])
            ->latest()
            ->get();

        $selectedConversation = $this->conversationQuery($request)
            ->with(['messages' => fn ($query) => $query->oldest()])
            ->latest()
            ->first();

        return Inertia::render('AcademicAssistant/Index', [
            'conversations' => $conversations,
            'selectedConversation' => $selectedConversation,
        ]);
    }

    public function store(Request $request, AcademicAssistantService $assistant): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'question' => ['required', 'string', 'max:2000'],
            'conversation_id' => [
                'nullable',
                'integer',
                Rule::exists('chat_conversations', 'id'),
            ],
        ]);

        if (
            isset($validated['conversation_id'])
            && ! $this->conversationQuery($request)->whereKey($validated['conversation_id'])->exists()
        ) {
            abort(403);
        }

        $result = $assistant->ask(
            user: $user,
            question: $validated['question'],
            conversationId: $validated['conversation_id'] ?? null,
        );

        return response()->json([
            'conversation' => $result['conversation'],
            'user_message' => $result['user_message'] ?? null,
            'assistant_message' => $result['assistant_message'] ?? $result['message'] ?? null,
            'answer' => $result['answer'] ?? null,
        ]);
    }

    public function show(Request $request, ChatConversation $conversation): Response
    {
        $this->authorizeConversation($request, $conversation);

        return Inertia::render('AcademicAssistant/Index', [
            'conversations' => $this->conversationQuery($request)
                ->with(['messages' => fn ($query) => $query->latest()->limit(1)])
                ->latest()
                ->get(),
            'selectedConversation' => $conversation->load(['messages' => fn ($query) => $query->oldest()]),
        ]);
    }

    private function conversationQuery(Request $request)
    {
        $user = $request->user();

        return ChatConversation::query()
            ->where('user_id', $user->id)
            ->where(function ($query) use ($user) {
                $query->where('establishment_id', $user->establishment_id)
                    ->orWhereNull('establishment_id');
            });
    }

    private function authorizeConversation(Request $request, ChatConversation $conversation): void
    {
        $user = $request->user();

        abort_unless((int) $conversation->user_id === (int) $user->id, 403);
        abort_unless(
            $conversation->establishment_id === null
            || (int) $conversation->establishment_id === (int) $user->establishment_id,
            403
        );
    }
}
