<?php

namespace App\Services\AcademicAssistant\Providers;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

class OllamaAssistantProvider implements AssistantProviderInterface
{
    public function generate(string $question, array $context): ?string
    {
        $url = rtrim((string) config('academic-assistant.ollama.url'), '/').'/api/generate';
        $timeout = (int) config('academic-assistant.ollama.timeout', 90);

        try {
            $response = Http::timeout($timeout)->post($url, [
                'model' => (string) config('academic-assistant.ollama.model', 'phi3:mini'),
                'system' => $this->systemPrompt(),
                'prompt' => $this->buildPrompt($question, $context),
                'stream' => false,
                'options' => [
                    'temperature' => 0.2,
                ],
            ]);

            if (! $response->successful()) {
                Log::warning('Ollama academic assistant request failed.', [
                    'status' => $response->status(),
                ]);

                return null;
            }

            $data = $response->json();

            if (! is_array($data)) {
                Log::warning('Ollama academic assistant returned invalid JSON.');

                return null;
            }

            $answer = trim((string) ($data['response'] ?? ''));

            return $answer !== '' ? $answer : null;
        } catch (Throwable $exception) {
            Log::warning('Ollama academic assistant is unavailable.', [
                'exception' => $exception::class,
            ]);

            return null;
        }
    }

    private function buildPrompt(string $question, array $context): string
    {
        $safeContext = [
            'scope' => $context['scope'] ?? null,
            'user' => $context['user'] ?? null,
            'classes' => $context['classes'] ?? [],
            'students' => $context['students'] ?? [],
            'grades' => $context['grades'] ?? [],
            'attendance' => $context['attendance'] ?? [],
            'risk' => $context['risk'] ?? [],
        ];

        $contextJson = json_encode($safeContext, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

        return <<<PROMPT
Contexte autorise :
{$contextJson}

Question utilisateur :
{$question}
PROMPT;
    }

    private function systemPrompt(): string
    {
        return <<<'PROMPT'
Tu es un assistant academique securise.

Regles obligatoires :
- Reponds en francais.
- Reponds uniquement a partir du contexte fourni.
- N'invente jamais de chiffres, noms, notes, absences, classes ou risques.
- Si une information n'est pas disponible dans le contexte, dis-le clairement.
- Respecte strictement le perimetre autorise de l'utilisateur.
- Ne mentionne jamais JSON, provider, prompt ou details techniques.
- Sois clair, utile et concis.
PROMPT;
    }
}
