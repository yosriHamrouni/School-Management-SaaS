<?php

use App\Http\Middleware\HandleInertiaRequests;
use App\Models\Role;
use App\Models\StudentRiskPrediction;
use App\Models\User;
use Tests\Support\RiskTestDataFactory;

test('risk students index requires authentication', function () {
    $this->withoutMiddleware(HandleInertiaRequests::class);

    $this->getJson(route('risk.students.index'))
        ->assertUnauthorized();
});

test('risk students endpoints are restricted to authorized roles', function () {
    $this->withoutMiddleware(HandleInertiaRequests::class);

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

    StudentRiskPrediction::query()->create([
        'student_id' => $student['profile']->id,
        'establishment_id' => $establishment->id,
        'school_year_id' => $schoolYear->id,
        'risk_level' => 'high',
        'risk_score' => 72,
        'reasons' => ['Nombre d absences eleve'],
        'features' => ['absence_count' => 9],
        'source' => 'rule_based',
        'analyzed_at' => now(),
    ]);

    $teacher = User::factory()->create([
        'establishment_id' => $establishment->id,
    ]);
    $teacher->roles()->syncWithoutDetaching([
        Role::firstOrCreate(['name' => 'teacher'])->id,
    ]);

    $studentUser = User::factory()->create([
        'establishment_id' => $establishment->id,
    ]);
    $studentUser->roles()->syncWithoutDetaching([
        Role::firstOrCreate(['name' => 'student'])->id,
    ]);

    $this->actingAs($teacher)
        ->getJson(route('risk.students.index', ['school_year_id' => $schoolYear->id]))
        ->assertOk();

    $this->actingAs($teacher)
        ->getJson(route('risk.students.show', [
            'student' => $student['profile']->id,
            'school_year_id' => $schoolYear->id,
        ]))
        ->assertOk();

    $this->actingAs($studentUser)
        ->getJson(route('risk.students.index', ['school_year_id' => $schoolYear->id]))
        ->assertForbidden();
});

test('risk students index returns only the latest prediction per student for the authenticated establishment', function () {
    $this->withoutMiddleware(HandleInertiaRequests::class);

    $tenantA = RiskTestDataFactory::createEstablishment('Tenant A', 'TEN-A');
    $tenantB = RiskTestDataFactory::createEstablishment('Tenant B', 'TEN-B');

    $yearA = RiskTestDataFactory::createAcademicYear($tenantA, '2025-2026', true);
    $yearB = RiskTestDataFactory::createAcademicYear($tenantB, '2025-2026', true);

    $classA1 = RiskTestDataFactory::createClass($tenantA, $yearA, '1A');
    $classA2 = RiskTestDataFactory::createClass($tenantA, $yearA, '2A');
    $classB = RiskTestDataFactory::createClass($tenantB, $yearB, '9B');

    $studentA1 = RiskTestDataFactory::createStudent($tenantA, $classA1, 'A001', 'Alice Martin', 'alice@example.com');
    $studentA2 = RiskTestDataFactory::createStudent($tenantA, $classA2, 'A002', 'Brahim Salah', 'brahim@example.com');
    $studentB = RiskTestDataFactory::createStudent($tenantB, $classB, 'B001', 'Other Tenant', 'other@example.com');

    StudentRiskPrediction::query()->create([
        'student_id' => $studentA1['profile']->id,
        'establishment_id' => $tenantA->id,
        'school_year_id' => $yearA->id,
        'risk_level' => 'medium',
        'risk_score' => 45,
        'reasons' => ['Absences a surveiller'],
        'features' => ['absence_count' => 5],
        'source' => 'rule_based',
        'analyzed_at' => now()->subDay(),
    ]);

    StudentRiskPrediction::query()->create([
        'student_id' => $studentA1['profile']->id,
        'establishment_id' => $tenantA->id,
        'school_year_id' => $yearA->id,
        'risk_level' => 'high',
        'risk_score' => 78,
        'reasons' => ['Nombre d absences eleve'],
        'features' => ['absence_count' => 10],
        'source' => 'rule_based',
        'analyzed_at' => now(),
    ]);

    StudentRiskPrediction::query()->create([
        'student_id' => $studentA2['profile']->id,
        'establishment_id' => $tenantA->id,
        'school_year_id' => $yearA->id,
        'risk_level' => 'low',
        'risk_score' => 8,
        'reasons' => [],
        'features' => ['absence_count' => 0],
        'source' => 'rule_based',
        'analyzed_at' => now()->subHours(2),
    ]);

    StudentRiskPrediction::query()->create([
        'student_id' => $studentB['profile']->id,
        'establishment_id' => $tenantB->id,
        'school_year_id' => $yearB->id,
        'risk_level' => 'high',
        'risk_score' => 90,
        'reasons' => ['Tenant B only'],
        'features' => ['absence_count' => 12],
        'source' => 'rule_based',
        'analyzed_at' => now(),
    ]);

    $admin = User::factory()->create([
        'establishment_id' => $tenantA->id,
    ]);
    $admin->roles()->syncWithoutDetaching([
        Role::firstOrCreate(['name' => 'establishment_admin'])->id,
    ]);

    $this->actingAs($admin)
        ->getJson(route('risk.students.index', ['school_year_id' => $yearA->id]))
        ->assertOk()
        ->assertJsonPath('data.0.student_id', $studentA1['profile']->id)
        ->assertJsonPath('data.0.risk.level', 'high')
        ->assertJsonPath('data.0.risk.score', 78)
        ->assertJsonCount(2, 'data');
});

test('risk students index supports class risk level search and pagination filters', function () {
    $this->withoutMiddleware(HandleInertiaRequests::class);

    $establishment = RiskTestDataFactory::createEstablishment('Tenant A', 'TEN-A');
    $schoolYear = RiskTestDataFactory::createAcademicYear($establishment, '2025-2026', true);
    $classA = RiskTestDataFactory::createClass($establishment, $schoolYear, '3 Info A');
    $classB = RiskTestDataFactory::createClass($establishment, $schoolYear, '3 Info B');

    $studentA = RiskTestDataFactory::createStudent($establishment, $classA, 'ST-001', 'Nour A', 'nour-a@example.com');
    $studentB = RiskTestDataFactory::createStudent($establishment, $classB, 'ST-002', 'Nour B', 'nour-b@example.com');

    StudentRiskPrediction::query()->create([
        'student_id' => $studentA['profile']->id,
        'establishment_id' => $establishment->id,
        'school_year_id' => $schoolYear->id,
        'risk_level' => 'high',
        'risk_score' => 70,
        'reasons' => ['Plusieurs matieres en difficulte'],
        'features' => ['failed_subjects_count' => 4],
        'source' => 'rule_based',
        'analyzed_at' => now(),
    ]);

    StudentRiskPrediction::query()->create([
        'student_id' => $studentB['profile']->id,
        'establishment_id' => $establishment->id,
        'school_year_id' => $schoolYear->id,
        'risk_level' => 'medium',
        'risk_score' => 35,
        'reasons' => ['Absences a surveiller'],
        'features' => ['absence_count' => 4],
        'source' => 'rule_based',
        'analyzed_at' => now()->subMinute(),
    ]);

    $admin = User::factory()->create([
        'establishment_id' => $establishment->id,
    ]);
    $admin->roles()->syncWithoutDetaching([
        Role::firstOrCreate(['name' => 'establishment_admin'])->id,
    ]);

    $this->actingAs($admin)
        ->getJson(route('risk.students.index', [
            'school_year_id' => $schoolYear->id,
            'class_id' => $classA->id,
            'risk_level' => 'high',
            'search' => 'ST-001',
            'per_page' => 1,
        ]))
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.student_id', $studentA['profile']->id)
        ->assertJsonPath('meta.per_page', 1)
        ->assertJsonPath('data.0.class.id', $classA->id);
});

test('risk student show returns the latest prediction details and null when prediction is missing for the selected year', function () {
    $this->withoutMiddleware(HandleInertiaRequests::class);

    $establishment = RiskTestDataFactory::createEstablishment('Tenant A', 'TEN-A');
    $currentYear = RiskTestDataFactory::createAcademicYear($establishment, '2025-2026', true);
    $previousYear = RiskTestDataFactory::createAcademicYear($establishment, '2024-2025', false, 'archived');
    $class = RiskTestDataFactory::createClass($establishment, $currentYear, '1A');
    $student = RiskTestDataFactory::createStudent($establishment, $class, 'ST-100', 'Rim Ben Ali', 'rim@example.com');

    StudentRiskPrediction::query()->create([
        'student_id' => $student['profile']->id,
        'establishment_id' => $establishment->id,
        'school_year_id' => $currentYear->id,
        'risk_level' => 'high',
        'risk_score' => 72,
        'reasons' => ['Moyenne generale inferieure a 10'],
        'features' => [
            'general_average' => 8.75,
            'absence_count' => 9,
            'late_count' => 3,
            'failed_subjects_count' => 4,
            'recent_average' => 7.5,
            'average_trend' => -1.25,
        ],
        'source' => 'rule_based',
        'analyzed_at' => now(),
    ]);

    $admin = User::factory()->create([
        'establishment_id' => $establishment->id,
    ]);
    $admin->roles()->syncWithoutDetaching([
        Role::firstOrCreate(['name' => 'establishment_admin'])->id,
    ]);

    $this->actingAs($admin)
        ->getJson(route('risk.students.show', [
            'student' => $student['profile']->id,
            'school_year_id' => $currentYear->id,
        ]))
        ->assertOk()
        ->assertJsonPath('data.student.id', $student['profile']->id)
        ->assertJsonPath('data.student.full_name', 'Rim Ben Ali')
        ->assertJsonPath('data.risk_prediction.level', 'high')
        ->assertJsonPath('data.risk_prediction.score', 72)
        ->assertJsonPath('data.risk_prediction.source', 'rule_based')
        ->assertJsonPath('data.risk_prediction.features.absence_count', 9)
        ->assertJsonPath('data.risk_prediction.reasons.0', 'Moyenne generale inferieure a 10');

    $this->actingAs($admin)
        ->getJson(route('risk.students.show', [
            'student' => $student['profile']->id,
            'school_year_id' => $previousYear->id,
        ]))
        ->assertOk()
        ->assertJsonPath('data.student.id', $student['profile']->id)
        ->assertJsonPath('data.risk_prediction', null);
});

test('risk student show returns not found for a student outside the authenticated establishment', function () {
    $this->withoutMiddleware(HandleInertiaRequests::class);

    $tenantA = RiskTestDataFactory::createEstablishment('Tenant A', 'TEN-A');
    $tenantB = RiskTestDataFactory::createEstablishment('Tenant B', 'TEN-B');

    $yearA = RiskTestDataFactory::createAcademicYear($tenantA, '2025-2026', true);
    $yearB = RiskTestDataFactory::createAcademicYear($tenantB, '2025-2026', true);

    $classA = RiskTestDataFactory::createClass($tenantA, $yearA, '1A');
    $classB = RiskTestDataFactory::createClass($tenantB, $yearB, '1B');

    RiskTestDataFactory::createStudent($tenantA, $classA, 'A001', 'Tenant A Student', 'tenant-a-student@example.com');
    $studentB = RiskTestDataFactory::createStudent($tenantB, $classB, 'B001', 'Tenant B Student', 'tenant-b-student@example.com');

    $admin = User::factory()->create([
        'establishment_id' => $tenantA->id,
    ]);
    $admin->roles()->syncWithoutDetaching([
        Role::firstOrCreate(['name' => 'establishment_admin'])->id,
    ]);

    $this->actingAs($admin)
        ->getJson(route('risk.students.show', [
            'student' => $studentB['profile']->id,
            'school_year_id' => $yearA->id,
        ]))
        ->assertNotFound();
});
