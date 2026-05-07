<?php

namespace App\Services\AcademicAssistant;

use App\Models\ChatConversation;
use App\Models\ChatMessage;
use App\Models\User;
use App\Services\AcademicAssistant\Providers\AssistantProviderFactory;
use Illuminate\Support\Str;

class AcademicAssistantService
{
    public function __construct(
        private AcademicAssistantContextBuilder $contextBuilder,
        private AssistantProviderFactory $providerFactory,
    ) {}

    public function ask(User $user, string $question, ?int $conversationId = null): array
    {
        $conversation = $this->getOrCreateConversation($user, $question, $conversationId);

        $userMessage = ChatMessage::create([
            'conversation_id' => $conversation->id,
            'role' => ChatMessage::ROLE_USER,
            'content' => $question,
        ]);

        $context = $this->contextBuilder->build($user);
        $provider = $this->providerFactory->make();
        $answer = $provider->generate($question, $context);
        $source = $this->providerFactory->configuredProvider();

        if ($answer === null || trim($answer) === '') {
            $answer = $this->providerFactory->fallback()->generate($question, $context);
            $source = 'rule_based_fallback';
        }

        $answer = trim((string) $answer);

        if ($answer === '') {
            $answer = "Je ne peux pas repondre avec les donnees disponibles dans votre perimetre autorise.";
            $source = 'rule_based_fallback';
        }

        $assistantMessage = ChatMessage::create([
            'conversation_id' => $conversation->id,
            'role' => ChatMessage::ROLE_ASSISTANT,
            'content' => $answer,
            'metadata' => [
                'source' => $source,
                'context_scope' => $context['scope'] ?? null,
            ],
        ]);

        return [
            'conversation' => $conversation->fresh()->load([
                'messages' => fn ($query) => $query->orderBy('created_at'),
            ]),
            'user_message' => $userMessage,
            'assistant_message' => $assistantMessage,
            'message' => $assistantMessage,
            'answer' => $answer,
        ];
    }

    private function getOrCreateConversation(User $user, string $question, ?int $conversationId): ChatConversation
    {
        if ($conversationId) {
            return ChatConversation::query()
                ->where('id', $conversationId)
                ->where('user_id', $user->id)
                ->where(function ($query) use ($user) {
                    $query->where('establishment_id', $user->establishment_id)
                        ->orWhereNull('establishment_id');
                })
                ->firstOrFail();
        }

        return ChatConversation::create([
            'user_id' => $user->id,
            'establishment_id' => $user->establishment_id,
            'title' => Str::limit($question, 60),
        ]);
    }
}
