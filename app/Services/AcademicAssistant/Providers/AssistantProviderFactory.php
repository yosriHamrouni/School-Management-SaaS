<?php

namespace App\Services\AcademicAssistant\Providers;

class AssistantProviderFactory
{
    public function make(): AssistantProviderInterface
    {
        return match ($this->configuredProvider()) {
            'ollama' => app(OllamaAssistantProvider::class),
            'rule_based' => app(RuleBasedAssistantProvider::class),
            default => app(RuleBasedAssistantProvider::class),
        };
    }

    public function fallback(): AssistantProviderInterface
    {
        return app(RuleBasedAssistantProvider::class);
    }

    public function configuredProvider(): string
    {
        return strtolower(trim((string) config('academic-assistant.provider', 'rule_based')));
    }
}
