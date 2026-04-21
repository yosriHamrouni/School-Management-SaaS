<?php

use App\Services\Risk\StudentRiskFeatureBuilder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

function riskRawPayload(array $grades = [], int $absences = 0, int $lates = 0): array
{
    return [
        'student_id' => 10,
        'establishment_id' => 20,
        'school_year_id' => 30,
        'grades' => $grades,
        'absences_count' => $absences,
        'lates_count' => $lates,
    ];
}

test('it calculates the general average when grades exist', function () {
    $builder = app(StudentRiskFeatureBuilder::class);

    $payload = $builder->build(riskRawPayload([
        ['subject_id' => 1, 'subject_name' => 'Math', 'value' => 10, 'recorded_at' => '2025-01-10'],
        ['subject_id' => 2, 'subject_name' => 'Physics', 'value' => 14, 'recorded_at' => '2025-01-12'],
    ]));

    expect($payload['features']['general_average'])->toBe(12.0);
});

test('it falls back to zero for averages when there are no grades', function () {
    $builder = app(StudentRiskFeatureBuilder::class);

    $payload = $builder->build(riskRawPayload());

    expect($payload['features']['general_average'])->toBe(0.0)
        ->and($payload['features']['recent_average'])->toBe(0.0)
        ->and($payload['features']['average_trend'])->toBe(0.0)
        ->and($payload['features']['failed_subjects_count'])->toBe(0);
});

test('it calculates failed subjects count from per subject averages', function () {
    $builder = app(StudentRiskFeatureBuilder::class);

    $payload = $builder->build(riskRawPayload([
        ['subject_id' => 1, 'subject_name' => 'Math', 'value' => 8, 'recorded_at' => '2025-01-10'],
        ['subject_id' => 1, 'subject_name' => 'Math', 'value' => 10, 'recorded_at' => '2025-01-12'],
        ['subject_id' => 2, 'subject_name' => 'Physics', 'value' => 7, 'recorded_at' => '2025-01-14'],
        ['subject_id' => 2, 'subject_name' => 'Physics', 'value' => 9, 'recorded_at' => '2025-01-16'],
        ['subject_id' => 3, 'subject_name' => 'French', 'value' => 12, 'recorded_at' => '2025-01-18'],
    ]));

    expect($payload['features']['failed_subjects_count'])->toBe(2);
});

test('it calculates recent average from the three latest grades', function () {
    $builder = app(StudentRiskFeatureBuilder::class);

    $payload = $builder->build(riskRawPayload([
        ['subject_id' => 1, 'subject_name' => 'Math', 'value' => 6, 'recorded_at' => '2025-01-01'],
        ['subject_id' => 1, 'subject_name' => 'Math', 'value' => 8, 'recorded_at' => '2025-01-05'],
        ['subject_id' => 2, 'subject_name' => 'Physics', 'value' => 12, 'recorded_at' => '2025-01-10'],
        ['subject_id' => 2, 'subject_name' => 'Physics', 'value' => 14, 'recorded_at' => '2025-01-15'],
        ['subject_id' => 3, 'subject_name' => 'French', 'value' => 16, 'recorded_at' => '2025-01-20'],
    ]));

    expect($payload['features']['recent_average'])->toBe(14.0);
});

test('it calculates average trend when enough grades are available', function () {
    $builder = app(StudentRiskFeatureBuilder::class);

    $payload = $builder->build(riskRawPayload([
        ['subject_id' => 1, 'subject_name' => 'Math', 'value' => 14, 'recorded_at' => '2025-01-01'],
        ['subject_id' => 2, 'subject_name' => 'Physics', 'value' => 12, 'recorded_at' => '2025-01-05'],
        ['subject_id' => 1, 'subject_name' => 'Math', 'value' => 10, 'recorded_at' => '2025-01-10'],
        ['subject_id' => 2, 'subject_name' => 'Physics', 'value' => 8, 'recorded_at' => '2025-01-15'],
    ]));

    expect($payload['features']['average_trend'])->toBe(-4.0);
});

test('it falls back to zero trend when there is insufficient data', function () {
    $builder = app(StudentRiskFeatureBuilder::class);

    $payload = $builder->build(riskRawPayload([
        ['subject_id' => 1, 'subject_name' => 'Math', 'value' => 14, 'recorded_at' => '2025-01-01'],
        ['subject_id' => 2, 'subject_name' => 'Physics', 'value' => 12, 'recorded_at' => '2025-01-05'],
        ['subject_id' => 1, 'subject_name' => 'Math', 'value' => 10, 'recorded_at' => '2025-01-10'],
    ]));

    expect($payload['features']['average_trend'])->toBe(0.0);
});
