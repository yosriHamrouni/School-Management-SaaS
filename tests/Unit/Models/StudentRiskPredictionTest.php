<?php

use App\Models\StudentRiskPrediction;
use Carbon\CarbonInterface;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Support\RiskTestDataFactory;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

test('it creates a student risk prediction with expected casts', function () {
    $establishment = RiskTestDataFactory::createEstablishment('Tenant A', 'TEN-A');
    $schoolYear = RiskTestDataFactory::createAcademicYear($establishment, '2025-2026', true);
    $class = RiskTestDataFactory::createClass($establishment, $schoolYear, '1A');
    $student = RiskTestDataFactory::createStudent(
        $establishment,
        $class,
        'A001',
        'Student A',
        'student-a@example.com',
    );

    $prediction = StudentRiskPrediction::query()->create([
        'student_id' => $student['profile']->id,
        'establishment_id' => $establishment->id,
        'school_year_id' => $schoolYear->id,
        'risk_level' => 'medium',
        'risk_score' => 35,
        'reasons' => ['Absences a surveiller'],
        'features' => [
            'general_average' => 11.5,
            'absence_count' => 4,
        ],
        'source' => 'rule_based',
        'analyzed_at' => now(),
    ]);

    expect($prediction->exists)->toBeTrue()
        ->and($prediction->reasons)->toBeArray()
        ->and($prediction->features)->toBeArray()
        ->and($prediction->risk_score)->toBeInt()
        ->and($prediction->analyzed_at)->toBeInstanceOf(CarbonInterface::class);
});
