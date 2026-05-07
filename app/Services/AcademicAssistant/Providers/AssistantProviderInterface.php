<?php

namespace App\Services\AcademicAssistant\Providers;

interface AssistantProviderInterface
{
    public function generate(string $question, array $context): ?string;
}
