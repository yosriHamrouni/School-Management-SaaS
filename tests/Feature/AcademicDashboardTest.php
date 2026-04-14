<?php

use App\Models\AcademicYear;
use App\Models\Evaluation;
use App\Models\Establishment;
use App\Models\Grade;
use App\Models\Level;
use App\Models\Role;
use App\Models\SchoolClass;
use App\Models\Subject;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('academic dashboard is restricted to administration roles', function () {
    $user = User::factory()->create([
        'establishment_id' => Establishment::create([
            'name' => 'Dashboard School',
            'code' => 'DB-AUTH',
            'type' => 'School',
            'email' => 'dashboard-auth@school.test',
        ])->id,
    ]);

    $role = Role::firstOrCreate(['name' => 'teacher']);
    $user->roles()->syncWithoutDetaching([$role->id]);

    $this
        ->actingAs($user)
        ->get(route('academic-dashboard.index'))
        ->assertForbidden();
});

test('academic dashboard returns tenant scoped metrics for establishment administration', function () {
    $establishment = Establishment::create([
        'name' => 'Dashboard Main',
        'code' => 'DB-MAIN',
        'type' => 'School',
        'email' => 'dashboard-main@school.test',
    ]);

    $otherEstablishment = Establishment::create([
        'name' => 'Dashboard Other',
        'code' => 'DB-OTHER',
        'type' => 'School',
        'email' => 'dashboard-other@school.test',
    ]);

    $admin = User::factory()->create([
        'establishment_id' => $establishment->id,
    ]);
    $admin->roles()->syncWithoutDetaching([
        Role::firstOrCreate(['name' => 'establishment_admin'])->id,
    ]);

    $mainClass = createAcademicDashboardClass($establishment, 'Class A');
    $emptyClass = createAcademicDashboardClass($establishment, 'Class B');
    $otherClass = createAcademicDashboardClass($otherEstablishment, 'Class Z');

    $subject = Subject::create([
        'establishment_id' => $establishment->id,
        'name' => 'Mathematics',
    ]);

    $otherSubject = Subject::create([
        'establishment_id' => $otherEstablishment->id,
        'name' => 'Physics',
    ]);

    $studentOne = createAcademicDashboardStudent($establishment);
    $studentTwo = createAcademicDashboardStudent($establishment);
    $otherStudent = createAcademicDashboardStudent($otherEstablishment);

    $evaluation = Evaluation::create([
        'establishment_id' => $establishment->id,
        'class_id' => $mainClass->id,
        'subject_id' => $subject->id,
        'title' => 'Midterm',
        'evaluation_date' => '2026-01-15',
        'type' => 'exam',
        'coefficient' => 1,
        'max_grade' => 20,
        'created_by' => $admin->id,
        'updated_by' => $admin->id,
    ]);

    Grade::create([
        'establishment_id' => $establishment->id,
        'evaluation_id' => $evaluation->id,
        'student_id' => $studentOne->id,
        'grade' => 14,
        'created_by' => $admin->id,
        'updated_by' => $admin->id,
    ]);

    Grade::create([
        'establishment_id' => $establishment->id,
        'evaluation_id' => $evaluation->id,
        'student_id' => $studentTwo->id,
        'grade' => 8,
        'created_by' => $admin->id,
        'updated_by' => $admin->id,
    ]);

    $otherEvaluation = Evaluation::create([
        'establishment_id' => $otherEstablishment->id,
        'class_id' => $otherClass->id,
        'subject_id' => $otherSubject->id,
        'title' => 'Foreign Exam',
        'evaluation_date' => '2026-01-16',
        'type' => 'exam',
        'coefficient' => 1,
        'max_grade' => 20,
    ]);

    Grade::create([
        'establishment_id' => $otherEstablishment->id,
        'evaluation_id' => $otherEvaluation->id,
        'student_id' => $otherStudent->id,
        'grade' => 19,
    ]);

    $this
        ->actingAs($admin)
        ->get(route('academic-dashboard.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('AcademicDashboard/Index')
            ->where('stats.totalClasses', 2)
            ->where('stats.totalStudents', 2)
            ->where('stats.studentsWithGrades', 2)
            ->where('stats.successRate', 50.0)
            ->where('stats.gradedClasses', 1)
            ->has('averagesByClass', 2)
            ->where('averagesByClass.0.className', 'Class A')
            ->where('averagesByClass.0.average', 11.0)
            ->where('averagesByClass.1.className', 'Class B')
            ->where('averagesByClass.1.average', 0.0)
            ->where('charts.successBreakdown.values.0', 1)
            ->where('charts.successBreakdown.values.1', 1),
        );
});

function createAcademicDashboardClass(Establishment $establishment, string $name): SchoolClass
{
    $academicYear = AcademicYear::firstOrCreate(
        [
            'establishment_id' => $establishment->id,
            'name' => '2025-2026',
        ],
        [
            'start_date' => '2025-09-01',
            'end_date' => '2026-06-30',
            'status' => 'active',
            'is_current' => true,
        ],
    );

    $level = Level::create([
        'establishment_id' => $establishment->id,
        'name' => fake()->unique()->word(),
    ]);

    return SchoolClass::create([
        'establishment_id' => $establishment->id,
        'level_id' => $level->id,
        'academic_year_id' => $academicYear->id,
        'name' => $name,
    ]);
}

function createAcademicDashboardStudent(Establishment $establishment): User
{
    $student = User::factory()->create([
        'establishment_id' => $establishment->id,
    ]);

    $student->roles()->syncWithoutDetaching([
        Role::firstOrCreate(['name' => 'student'])->id,
    ]);

    \App\Models\StudentProfile::create([
        'user_id' => $student->id,
        'establishment_id' => $establishment->id,
        'student_number' => fake()->unique()->bothify('STD-###'),
    ]);

    return $student;
}
