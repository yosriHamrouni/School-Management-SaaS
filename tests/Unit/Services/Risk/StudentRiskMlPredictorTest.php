<?php

use App\Services\Risk\StudentRiskMlPredictor;
use Tests\TestCase;

uses(TestCase::class);

afterEach(function () {
    $scriptPath = config('risk.predict_script');

    if (is_string($scriptPath) && str_contains($scriptPath, sys_get_temp_dir()) && is_file($scriptPath)) {
        unlink($scriptPath);
    }
});

test('it returns a valid prediction array when the process succeeds', function () {
    $scriptPath = createRiskPredictorFixtureScript(
        <<<'PHP'
        <?php

        stream_get_contents(STDIN);

        echo json_encode([
            'prediction' => 'high',
            'score' => 0.969,
            'source' => 'ml',
        ]);
        PHP,
    );

    config([
        'risk.ml_enabled' => true,
        'risk.python_bin' => PHP_BINARY,
        'risk.predict_script' => $scriptPath,
        'risk.timeout' => 5,
    ]);

    $prediction = app(StudentRiskMlPredictor::class)->predict([
        'general_average' => 8.75,
        'absence_count' => 9,
    ]);

    expect($prediction)->toBe([
        'prediction' => 'high',
        'score' => 0.969,
        'source' => 'ml',
    ]);
});

test('it returns null when the script is missing', function () {
    config([
        'risk.ml_enabled' => true,
        'risk.python_bin' => PHP_BINARY,
        'risk.predict_script' => sys_get_temp_dir().DIRECTORY_SEPARATOR.'missing-risk-predictor.php',
        'risk.timeout' => 5,
    ]);

    expect(app(StudentRiskMlPredictor::class)->predict([]))->toBeNull();
});

test('it returns null when the output is invalid json', function () {
    $scriptPath = createRiskPredictorFixtureScript(
        <<<'PHP'
        <?php

        echo 'not-json';
        PHP,
    );

    config([
        'risk.ml_enabled' => true,
        'risk.python_bin' => PHP_BINARY,
        'risk.predict_script' => $scriptPath,
        'risk.timeout' => 5,
    ]);

    expect(app(StudentRiskMlPredictor::class)->predict([]))->toBeNull();
});

test('it returns null when the output contains an error field', function () {
    $scriptPath = createRiskPredictorFixtureScript(
        <<<'PHP'
        <?php

        echo json_encode(['error' => 'model unavailable']);
        PHP,
    );

    config([
        'risk.ml_enabled' => true,
        'risk.python_bin' => PHP_BINARY,
        'risk.predict_script' => $scriptPath,
        'risk.timeout' => 5,
    ]);

    expect(app(StudentRiskMlPredictor::class)->predict([]))->toBeNull();
});

function createRiskPredictorFixtureScript(string $contents): string
{
    $path = tempnam(sys_get_temp_dir(), 'risk-predictor-');

    if ($path === false) {
        throw new RuntimeException('Unable to create temporary predictor fixture.');
    }

    $scriptPath = $path.'.php';
    rename($path, $scriptPath);
    file_put_contents($scriptPath, $contents);

    return $scriptPath;
}
