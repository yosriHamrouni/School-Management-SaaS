<?php

use App\Services\Risk\StudentRiskRuleEngine;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

function riskFeaturePayload(array $features): array
{
    return [
        'student_id' => 10,
        'establishment_id' => 20,
        'school_year_id' => 30,
        'features' => $features,
    ];
}

test('it classifies a low risk student', function () {
    $engine = app(StudentRiskRuleEngine::class);

    $result = $engine->evaluate(riskFeaturePayload([
        'general_average' => 14.5,
        'absence_count' => 1,
        'late_count' => 0,
        'failed_subjects_count' => 0,
        'recent_average' => 15.0,
        'average_trend' => 0.5,
    ]));

    expect($result['risk_level'])->toBe('low')
        ->and($result['risk_score'])->toBe(0)
        ->and($result['reasons'])->toBeArray()->toBeEmpty();
});

test('it classifies a medium risk student', function () {
    $engine = app(StudentRiskRuleEngine::class);

    $result = $engine->evaluate(riskFeaturePayload([
        'general_average' => 11.0,
        'absence_count' => 4,
        'late_count' => 1,
        'failed_subjects_count' => 1,
        'recent_average' => 10.5,
        'average_trend' => 0.0,
    ]));

    expect($result['risk_level'])->toBe('medium')
        ->and($result['risk_score'])->toBe(35);
});

test('it classifies a high risk student', function () {
    $engine = app(StudentRiskRuleEngine::class);

    $result = $engine->evaluate(riskFeaturePayload([
        'general_average' => 8.5,
        'absence_count' => 9,
        'late_count' => 6,
        'failed_subjects_count' => 4,
        'recent_average' => 7.0,
        'average_trend' => -3.0,
    ]));

    expect($result['risk_level'])->toBe('high')
        ->and($result['risk_score'])->toBe(100);
});

test('it exposes readable reasons for triggered rules', function () {
    $engine = app(StudentRiskRuleEngine::class);

    $result = $engine->evaluate(riskFeaturePayload([
        'general_average' => 9.5,
        'absence_count' => 8,
        'late_count' => 6,
        'failed_subjects_count' => 3,
        'recent_average' => 8.0,
        'average_trend' => -1.5,
    ]));

    expect($result['reasons'])->toContain('Moyenne generale inferieure a 10')
        ->toContain('Nombre d absences eleve')
        ->toContain('Retards frequents')
        ->toContain('Plusieurs matieres en difficulte')
        ->toContain('Tendance recente en baisse');
});

test('it always bounds the score between zero and one hundred', function () {
    $engine = app(StudentRiskRuleEngine::class);

    $result = $engine->evaluate(riskFeaturePayload([
        'general_average' => -10,
        'absence_count' => 50,
        'late_count' => 50,
        'failed_subjects_count' => 10,
        'recent_average' => 0,
        'average_trend' => -10,
    ]));

    expect($result['risk_score'])->toBeGreaterThanOrEqual(0)
        ->toBeLessThanOrEqual(100);
});
