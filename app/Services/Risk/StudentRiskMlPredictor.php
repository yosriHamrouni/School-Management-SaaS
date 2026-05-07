<?php

namespace App\Services\Risk;

use Illuminate\Support\Facades\Log;
use JsonException;
use Symfony\Component\Process\Process;
use Throwable;

class StudentRiskMlPredictor
{
    /**
     * @param  array<string, mixed>  $features
     * @return array{prediction: string, score: float, source: string}|null
     */
    public function predict(array $features): ?array
    {
        if (! (bool) config('risk.ml_enabled', true)) {
            return null;
        }

        $pythonBin = (string) config('risk.python_bin', 'python');
        $scriptPath = $this->resolveScriptPath((string) config('risk.predict_script', base_path('ml/predict.py')));
        $timeout = max(1, (int) config('risk.timeout', 10));

        if ($pythonBin === '' || $scriptPath === '' || ! is_file($scriptPath)) {
            Log::warning('Student risk ML prediction unavailable: script or Python binary is not configured.', [
                'python_bin_configured' => $pythonBin !== '',
                'script_path' => $scriptPath,
                'script_exists' => $scriptPath !== '' && is_file($scriptPath),
            ]);

            return null;
        }

        try {
            $payload = json_encode($features, JSON_THROW_ON_ERROR);

            $process = new Process([$pythonBin, $scriptPath]);
            $process->setInput($payload);
            $process->setTimeout($timeout);
            $process->run();

            if (! $process->isSuccessful()) {
                Log::warning('Student risk ML prediction process failed.', [
                    'exit_code' => $process->getExitCode(),
                    'error_output' => trim($process->getErrorOutput()),
                ]);

                return null;
            }

            $output = trim($process->getOutput());

            if ($output === '') {
                Log::warning('Student risk ML prediction returned an empty output.');

                return null;
            }

            $decoded = json_decode($output, true, 512, JSON_THROW_ON_ERROR);

            if (! is_array($decoded)) {
                Log::warning('Student risk ML prediction returned a non-object JSON payload.');

                return null;
            }

            if (array_key_exists('error', $decoded)) {
                Log::warning('Student risk ML prediction returned an error payload.', [
                    'error' => is_scalar($decoded['error']) ? (string) $decoded['error'] : 'non_scalar_error',
                ]);

                return null;
            }

            return $this->normalizePrediction($decoded);
        } catch (JsonException $exception) {
            Log::warning('Student risk ML prediction JSON handling failed.', [
                'message' => $exception->getMessage(),
            ]);
        } catch (Throwable $exception) {
            Log::warning('Student risk ML prediction failed unexpectedly.', [
                'message' => $exception->getMessage(),
                'exception' => $exception::class,
            ]);
        }

        return null;
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array{prediction: string, score: float, source: string}|null
     */
    private function normalizePrediction(array $payload): ?array
    {
        $prediction = $payload['prediction'] ?? null;
        $score = $payload['score'] ?? null;
        $source = $payload['source'] ?? 'ml';

        if (! is_string($prediction) || trim($prediction) === '' || ! is_numeric($score)) {
            Log::warning('Student risk ML prediction payload is missing required fields.');

            return null;
        }

        return [
            'prediction' => trim($prediction),
            'score' => (float) $score,
            'source' => is_string($source) && trim($source) !== '' ? trim($source) : 'ml',
        ];
    }

    private function resolveScriptPath(string $path): string
    {
        if ($path === '' || str_starts_with($path, '/') || str_starts_with($path, '\\')) {
            return $path;
        }

        if (preg_match('/^[A-Za-z]:[\\\\\\/]/', $path) === 1) {
            return $path;
        }

        return base_path($path);
    }
}
