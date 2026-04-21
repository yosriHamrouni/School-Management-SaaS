<?php

use App\Models\StudentRiskPrediction;
use App\Services\Risk\StudentRiskAnalyzer;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Support\RiskTestDataFactory;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

test('it analyzes a valid student and persists the prediction', function () {
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

    $subject = RiskTestDataFactory::createSubject($establishment, 'Mathematics');
    $term = RiskTestDataFactory::createTerm($establishment, $schoolYear, 'Term 1');
    $evaluation = RiskTestDataFactory::createEvaluation(
        $establishment,
        $class,
        $subject,
        $term,
        'Math Exam',
        '2025-11-15',
    );

    RiskTestDataFactory::createGrade($student['user']->id, $evaluation, 8.0);

    $prediction = app(StudentRiskAnalyzer::class)->analyzeStudent(
        $student['profile']->id,
        $establishment->id,
        $schoolYear->id,
    );

    expect($prediction)->not->toBeNull()
        ->toBeInstanceOf(StudentRiskPrediction::class)
        ->and($prediction->student_id)->toBe($student['profile']->id)
        ->and($prediction->establishment_id)->toBe($establishment->id)
        ->and($prediction->school_year_id)->toBe($schoolYear->id)
        ->and($prediction->source)->toBe('rule_based')
        ->and($prediction->features)->toBeArray()
        ->and($prediction->reasons)->toBeArray()
        ->and($prediction->analyzed_at)->not->toBeNull()
        ->and($prediction->risk_level)->toBeString()
        ->and($prediction->risk_score)->toBeInt();

    expect(StudentRiskPrediction::query()->count())->toBe(1);
});

test('it returns null for a student outside the requested establishment', function () {
    $tenantA = RiskTestDataFactory::createEstablishment('Tenant A', 'TEN-A');
    $tenantB = RiskTestDataFactory::createEstablishment('Tenant B', 'TEN-B');

    $yearA = RiskTestDataFactory::createAcademicYear($tenantA, '2025-2026', true);
    $yearB = RiskTestDataFactory::createAcademicYear($tenantB, '2025-2026', true);

    $classA = RiskTestDataFactory::createClass($tenantA, $yearA, '1A');
    $classB = RiskTestDataFactory::createClass($tenantB, $yearB, '1B');

    RiskTestDataFactory::createStudent($tenantA, $classA, 'A001', 'Student A', 'student-a@example.com');
    $studentB = RiskTestDataFactory::createStudent($tenantB, $classB, 'B001', 'Student B', 'student-b@example.com');

    $prediction = app(StudentRiskAnalyzer::class)->analyzeStudent(
        $studentB['profile']->id,
        $tenantA->id,
        $yearA->id,
    );

    expect($prediction)->toBeNull()
        ->and(StudentRiskPrediction::query()->count())->toBe(0);
});

test('it analyzes multiple students and respects the provided student ids filter', function () {
    $establishment = RiskTestDataFactory::createEstablishment('Tenant A', 'TEN-A');
    $schoolYear = RiskTestDataFactory::createAcademicYear($establishment, '2025-2026', true);
    $class = RiskTestDataFactory::createClass($establishment, $schoolYear, '1A');

    $studentA = RiskTestDataFactory::createStudent(
        $establishment,
        $class,
        'A001',
        'Student A',
        'student-a@example.com',
    );
    $studentB = RiskTestDataFactory::createStudent(
        $establishment,
        $class,
        'A002',
        'Student B',
        'student-b@example.com',
    );
    $studentC = RiskTestDataFactory::createStudent(
        $establishment,
        $class,
        'A003',
        'Student C',
        'student-c@example.com',
    );

    $predictions = app(StudentRiskAnalyzer::class)->analyzeStudents(
        $establishment->id,
        $schoolYear->id,
        [$studentA['profile']->id, $studentC['profile']->id],
    );

    expect($predictions)->toHaveCount(2)
        ->and($predictions->pluck('student_id')->all())->toEqualCanonicalizing([
            $studentA['profile']->id,
            $studentC['profile']->id,
        ]);

    expect(StudentRiskPrediction::query()->count())->toBe(2)
        ->and(StudentRiskPrediction::query()->where('student_id', $studentB['profile']->id)->exists())->toBeFalse();
});

test('it respects establishment and school year filters during bulk analysis', function () {
    $tenantA = RiskTestDataFactory::createEstablishment('Tenant A', 'TEN-A');
    $tenantB = RiskTestDataFactory::createEstablishment('Tenant B', 'TEN-B');

    $activeYearA = RiskTestDataFactory::createAcademicYear($tenantA, '2025-2026', true);
    $archivedYearA = RiskTestDataFactory::createAcademicYear($tenantA, '2024-2025', false, 'archived');
    $activeYearB = RiskTestDataFactory::createAcademicYear($tenantB, '2025-2026', true);

    $classActiveA = RiskTestDataFactory::createClass($tenantA, $activeYearA, '1A');
    $classArchivedA = RiskTestDataFactory::createClass($tenantA, $archivedYearA, '1B');
    $classActiveB = RiskTestDataFactory::createClass($tenantB, $activeYearB, '2A');

    $studentActiveA = RiskTestDataFactory::createStudent(
        $tenantA,
        $classActiveA,
        'A001',
        'Student Active A',
        'student-active-a@example.com',
    );
    RiskTestDataFactory::createStudent(
        $tenantA,
        $classArchivedA,
        'A002',
        'Student Archived A',
        'student-archived-a@example.com',
    );
    RiskTestDataFactory::createStudent(
        $tenantB,
        $classActiveB,
        'B001',
        'Student Active B',
        'student-active-b@example.com',
    );

    $predictions = app(StudentRiskAnalyzer::class)->analyzeStudents($tenantA->id, $activeYearA->id);

    expect($predictions)->toHaveCount(1)
        ->and($predictions->first()->student_id)->toBe($studentActiveA['profile']->id)
        ->and($predictions->first()->establishment_id)->toBe($tenantA->id)
        ->and($predictions->first()->school_year_id)->toBe($activeYearA->id);
});

test('it creates a stable prediction when the student dataset is partially empty', function () {
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

    $prediction = app(StudentRiskAnalyzer::class)->analyzeStudent(
        $student['profile']->id,
        $establishment->id,
        $schoolYear->id,
    );

    expect($prediction)->not->toBeNull()
        ->and($prediction->features['general_average'])->toBe(0)
        ->and($prediction->features['absence_count'])->toBe(0)
        ->and($prediction->features['late_count'])->toBe(0)
        ->and($prediction->features['failed_subjects_count'])->toBe(0)
        ->and($prediction->features['recent_average'])->toBe(0)
        ->and($prediction->features['average_trend'])->toBe(0)
        ->and($prediction->risk_level)->toBeString()->not->toBe('')
        ->and($prediction->risk_score)->toBeInt()
        ->and($prediction->reasons)->toBeArray();
});

test('it keeps full history when a student is analyzed multiple times', function () {
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

    $analyzer = app(StudentRiskAnalyzer::class);

    $first = $analyzer->analyzeStudent($student['profile']->id, $establishment->id, $schoolYear->id);
    $second = $analyzer->analyzeStudent($student['profile']->id, $establishment->id, $schoolYear->id);

    expect($first)->not->toBeNull()
        ->and($second)->not->toBeNull()
        ->and($first?->id)->not->toBe($second?->id)
        ->and(StudentRiskPrediction::query()->count())->toBe(2);
});
