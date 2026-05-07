<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Throwable;

class CheckAcademicAssistantModel extends Command
{
    protected $signature = 'academic-assistant:check-model';

    protected $description = 'Verifie la configuration du modele local de l assistant academique.';

    public function handle(): int
    {
        $provider = (string) config('academic-assistant.provider', 'rule_based');

        $this->line('Provider configure: '.$provider);
        $this->line('Fallback rule-based: disponible');

        if ($provider !== 'ollama') {
            $this->info('Le provider Ollama n est pas actif. Le chatbot utilisera le provider rule-based.');

            return self::SUCCESS;
        }

        $url = rtrim((string) config('academic-assistant.ollama.url'), '/').'/api/generate';
        $model = (string) config('academic-assistant.ollama.model', 'phi3:mini');
        $timeout = (int) config('academic-assistant.ollama.timeout', 90);

        $this->line('Modele configure: '.$model);

        try {
            $response = Http::timeout($timeout)->post($url, [
                'model' => $model,
                'prompt' => 'Reponds uniquement par: OK',
                'stream' => false,
                'options' => [
                    'temperature' => 0.2,
                ],
            ]);

            if (! $response->successful()) {
                $this->warn('Ollama a repondu avec le statut HTTP '.$response->status().'.');
                $this->line('Le fallback rule-based reste disponible.');

                return self::SUCCESS;
            }

            $answer = trim((string) ($response->json('response') ?? ''));

            if ($answer === '') {
                $this->warn('Ollama a repondu, mais sans champ response exploitable.');
                $this->line('Le fallback rule-based reste disponible.');

                return self::SUCCESS;
            }

            $this->info('Ollama repond correctement.');
            $this->line('Reponse courte recue: '.$answer);
            $this->line('Le fallback rule-based reste disponible en cas d erreur.');

            return self::SUCCESS;
        } catch (Throwable $exception) {
            $this->warn('Ollama est indisponible ou a depasse le delai configure.');
            $this->line('Erreur: '.$exception::class);
            $this->line('Le fallback rule-based reste disponible.');

            return self::SUCCESS;
        }
    }
}
