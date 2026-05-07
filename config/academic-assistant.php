<?php

return [
    'provider' => env('ACADEMIC_ASSISTANT_PROVIDER', 'rule_based'),

    'ollama' => [
        'url' => env('OLLAMA_URL', 'http://127.0.0.1:11434'),
        'model' => env('OLLAMA_MODEL', 'phi3:mini'),
        'timeout' => (int) env('OLLAMA_TIMEOUT', 15),
    ],
];
