<?php

use App\Models\Attendance;
use App\Services\Risk\StudentRiskDataService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Support\RiskTestDataFactory;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

test('it respects the establishment filter when loading students data', function () {
    $tenantA = RiskTestDataFactory::createEstablishment('Tenant A', 'TEN-A');
    $tenantB = RiskTestDataFactory::createEstablishment('Tenant B', 'TEN-B');

    $yearA = RiskTestDataFactory::createAcademicYear($tenantA, '2025-2026', true);
    $yearB = RiskTestDataFactory::createAcademicYear($tenantB, '2025-2026', true);

    $classA = RiskTestDataFactory::createClass($tenantA, $yearA, '1A');
    $classB = RiskTestDataFactory::createClass($tenantB, $yearB, '2A');

    $studentA = RiskTestDataFactory::createStudent($tenantA, $classA, 'A001', 'Student A', 'student-a@example.com');
    RiskTestDataFactory::createStudent($tenantB, $classB, 'B001', 'Student B', 'student-b@example.com');

    $result = app(StudentRiskDataService::class)->getStudentsRawData($tenantA->id, $yearA->id);

    expect($result)->toHaveCount(1)
        ->and($result->first()['student_id'])->toBe($studentA['profile']->id)
        ->and($result->first()['establishment_id'])->toBe($tenantA->id);
});

test('it respects the school year filter for grades absences and lates', function () {
    $tenant = RiskTestDataFactory::createEstablishment('Tenant A', 'TEN-A');

    $activeYear = RiskTestDataFactory::createAcademicYear($tenant, '2025-2026', true);
    $archivedYear = RiskTestDataFactory::createAcademicYear($tenant, '2024-2025', false, 'archived');

    $activeClass = RiskTestDataFactory::createClass($tenant, $activeYear, '1A');
    $archivedClass = RiskTestDataFactory::createClass($tenant, $archivedYear, '1B');

    $student = RiskTestDataFactory::createStudent($tenant, $activeClass, 'A001', 'Student A', 'student-a@example.com');

    $subject = RiskTestDataFactory::createSubject($tenant, 'Mathematics');
    $activeTerm = RiskTestDataFactory::createTerm($tenant, $activeYear, 'Term 1');
    $archivedTerm = RiskTestDataFactory::createTerm($tenant, $archivedYear, 'Term 1');

    $activeEvaluation = RiskTestDataFactory::createEvaluation(
        $tenant,
        $activeClass,
        $subject,
        $activeTerm,
        'Active Exam',
        '2025-11-15',
    );

    $archivedEvaluation = RiskTestDataFactory::createEvaluation(
        $tenant,
        $archivedClass,
        $subject,
        $archivedTerm,
        'Archived Exam',
        '2024-11-15',
    );

    RiskTestDataFactory::createGrade($student['user']->id, $activeEvaluation, 14.5);
    RiskTestDataFactory::createGrade($student['user']->id, $archivedEvaluation, 6.0);

    $activeSchedule = RiskTestDataFactory::createSchedule(
        $tenant,
        $activeClass,
        $subject,
        $student['user']->id,
        'Monday',
        '08:00:00',
        '09:00:00',
    );

    $lateSchedule = RiskTestDataFactory::createSchedule(
        $tenant,
        $activeClass,
        $subject,
        $student['user']->id,
        'Wednesday',
        '11:00:00',
        '12:00:00',
    );

    $archivedSchedule = RiskTestDataFactory::createSchedule(
        $tenant,
        $archivedClass,
        $subject,
        $student['user']->id,
        'Tuesday',
        '10:00:00',
        '11:00:00',
    );

    RiskTestDataFactory::createAttendance(
        $tenant,
        $activeSchedule,
        $student['user']->id,
        $student['user']->id,
        Attendance::STATUS_ABSENT,
        '2025-10-01 08:00:00',
    );

    RiskTestDataFactory::createAttendance(
        $tenant,
        $lateSchedule,
        $student['user']->id,
        $student['user']->id,
        Attendance::STATUS_LATE,
        '2025-10-02 08:00:00',
    );

    RiskTestDataFactory::createAttendance(
        $tenant,
        $archivedSchedule,
        $student['user']->id,
        $student['user']->id,
        Attendance::STATUS_ABSENT,
        '2024-10-01 08:00:00',
    );

    $result = app(StudentRiskDataService::class)
        ->getStudentRawData($student['profile']->id, $tenant->id, $activeYear->id);

    expect($result)->not->toBeNull()
        ->and($result['grades'])->toHaveCount(1)
        ->and($result['grades'][0]['value'])->toBe(14.5)
        ->and($result['absences_count'])->toBe(1)
        ->and($result['lates_count'])->toBe(1);
});

test('it returns a stable empty structure when a student has no academic data', function () {
    $tenant = RiskTestDataFactory::createEstablishment('Tenant A', 'TEN-A');
    $year = RiskTestDataFactory::createAcademicYear($tenant, '2025-2026', true);
    $class = RiskTestDataFactory::createClass($tenant, $year, '1A');
    $student = RiskTestDataFactory::createStudent($tenant, $class, 'A001', 'Student A', 'student-a@example.com');

    $result = app(StudentRiskDataService::class)
        ->getStudentRawData($student['profile']->id, $tenant->id, $year->id);

    expect($result)->toBe([
        'student_id' => $student['profile']->id,
        'establishment_id' => $tenant->id,
        'school_year_id' => $year->id,
        'grades' => [],
        'absences_count' => 0,
        'lates_count' => 0,
    ]);
});

test('it returns null when the student does not belong to the requested establishment', function () {
    $tenantA = RiskTestDataFactory::createEstablishment('Tenant A', 'TEN-A');
    $tenantB = RiskTestDataFactory::createEstablishment('Tenant B', 'TEN-B');

    $yearA = RiskTestDataFactory::createAcademicYear($tenantA, '2025-2026', true);
    $yearB = RiskTestDataFactory::createAcademicYear($tenantB, '2025-2026', true);

    $classA = RiskTestDataFactory::createClass($tenantA, $yearA, '1A');
    $classB = RiskTestDataFactory::createClass($tenantB, $yearB, '2A');

    RiskTestDataFactory::createStudent($tenantA, $classA, 'A001', 'Student A', 'student-a@example.com');
    $studentB = RiskTestDataFactory::createStudent($tenantB, $classB, 'B001', 'Student B', 'student-b@example.com');

    $result = app(StudentRiskDataService::class)
        ->getStudentRawData($studentB['profile']->id, $tenantA->id, $yearA->id);

    expect($result)->toBeNull();
});

test('it returns an empty collection when the requested year is not active and current', function () {
    $tenant = RiskTestDataFactory::createEstablishment('Tenant A', 'TEN-A');
    $inactiveYear = RiskTestDataFactory::createAcademicYear($tenant, '2024-2025', false, 'archived');
    $class = RiskTestDataFactory::createClass($tenant, $inactiveYear, '1A');

    RiskTestDataFactory::createStudent($tenant, $class, 'A001', 'Student A', 'student-a@example.com');

    $result = app(StudentRiskDataService::class)->getStudentsRawData($tenant->id, $inactiveYear->id);

    expect($result)->toBeEmpty();
});
