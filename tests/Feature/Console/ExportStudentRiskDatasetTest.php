<?php

use App\Services\Risk\StudentRiskRuleEngine;
use Illuminate\Support\Facades\File;
use Tests\Support\RiskTestDataFactory;

afterEach(function (): void {
    $directory = base_path('tests/tmp');

    if (File::exists($directory)) {
        File::deleteDirectory($directory);
    }
});

test('it exports a csv dataset with risk features and labels', function () {
    $tenant = RiskTestDataFactory::createEstablishment('Tenant A', 'TEN-A');
    $year = RiskTestDataFactory::createAcademicYear($tenant, '2025-2026', true);
    $class = RiskTestDataFactory::createClass($tenant, $year, '1A');
    $student = RiskTestDataFactory::createStudent($tenant, $class, 'A001', 'Student A', 'student-a@example.com');

    $subjectMath = RiskTestDataFactory::createSubject($tenant, 'Mathematics');
    $subjectPhysics = RiskTestDataFactory::createSubject($tenant, 'Physics');
    $term = RiskTestDataFactory::createTerm($tenant, $year, 'Term 1');

    $evaluationOne = RiskTestDataFactory::createEvaluation(
        $tenant,
        $class,
        $subjectMath,
        $term,
        'Exam 1',
        '2025-10-01',
    );

    $evaluationTwo = RiskTestDataFactory::createEvaluation(
        $tenant,
        $class,
        $subjectPhysics,
        $term,
        'Exam 2',
        '2025-11-01',
    );

    RiskTestDataFactory::createGrade($student['user']->id, $evaluationOne, 8.0);
    RiskTestDataFactory::createGrade($student['user']->id, $evaluationTwo, 7.0);

    $teacherId = $student['user']->id;
    $days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    for ($index = 0; $index < StudentRiskRuleEngine::HIGH_ABSENCE_THRESHOLD; $index++) {
        $absentSchedule = RiskTestDataFactory::createSchedule(
            $tenant,
            $class,
            $subjectMath,
            $teacherId,
            $days[$index % count($days)],
            sprintf('%02d:00:00', 8 + $index),
            sprintf('%02d:00:00', 9 + $index),
        );

        RiskTestDataFactory::createAttendance(
            $tenant,
            $absentSchedule,
            $student['user']->id,
            $teacherId,
            'absent',
            now()->subDays($index + 1)->format('Y-m-d H:i:s'),
        );
    }

    for ($index = 0; $index < StudentRiskRuleEngine::MEDIUM_LATE_THRESHOLD; $index++) {
        $lateSchedule = RiskTestDataFactory::createSchedule(
            $tenant,
            $class,
            $subjectPhysics,
            $teacherId,
            $days[($index + 2) % count($days)],
            sprintf('%02d:00:00', 14 + $index),
            sprintf('%02d:00:00', 15 + $index),
        );

        RiskTestDataFactory::createAttendance(
            $tenant,
            $lateSchedule,
            $student['user']->id,
            $teacherId,
            'late',
            now()->subDays($index + 20)->format('Y-m-d H:i:s'),
        );
    }

    $outputPath = base_path('tests/tmp/risk/student-risk-dataset.csv');

    $this->artisan('risk:export-dataset', [
        'establishment_id' => $tenant->id,
        'school_year_id' => $year->id,
        '--path' => $outputPath,
    ])
        ->expectsOutputToContain('Dataset exporte: 1 eleve(s).')
        ->expectsOutputToContain($outputPath)
        ->assertSuccessful();

    expect(File::exists($outputPath))->toBeTrue();

    $lines = file($outputPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);

    expect($lines)->toHaveCount(2);

    $header = str_getcsv($lines[0]);
    $row = str_getcsv($lines[1]);

    expect($header)->toBe([
        'student_id',
        'school_year_id',
        'general_average',
        'absence_count',
        'late_count',
        'failed_subjects_count',
        'recent_average',
        'average_trend',
        'risk_label',
    ])->and($row[0])->toBe((string) $student['profile']->id)
        ->and($row[1])->toBe((string) $year->id)
        ->and($row[2])->toBe('7.5')
        ->and($row[3])->toBe((string) StudentRiskRuleEngine::HIGH_ABSENCE_THRESHOLD)
        ->and($row[4])->toBe((string) StudentRiskRuleEngine::MEDIUM_LATE_THRESHOLD)
        ->and($row[5])->toBe('2')
        ->and($row[6])->toBe('7.5')
        ->and($row[7])->toBe('0')
        ->and($row[8])->toBe('high');
});

test('it still creates a csv with only the header when no student data is available', function () {
    $tenant = RiskTestDataFactory::createEstablishment('Tenant A', 'TEN-A');
    $year = RiskTestDataFactory::createAcademicYear($tenant, '2025-2026', true);
    $outputPath = base_path('tests/tmp/risk/empty-dataset.csv');

    $this->artisan('risk:export-dataset', [
        'establishment_id' => $tenant->id,
        'school_year_id' => $year->id,
        '--path' => $outputPath,
    ])
        ->expectsOutputToContain('Aucun eleve exporte')
        ->expectsOutputToContain('Dataset exporte: 0 eleve(s).')
        ->assertSuccessful();

    expect(File::exists($outputPath))->toBeTrue();

    $lines = file($outputPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);

    expect($lines)->toHaveCount(1)
        ->and(str_getcsv($lines[0]))->toBe([
            'student_id',
            'school_year_id',
            'general_average',
            'absence_count',
            'late_count',
            'failed_subjects_count',
            'recent_average',
            'average_trend',
            'risk_label',
        ]);
});
