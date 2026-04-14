<?php

use App\Models\AcademicYear;
use App\Models\ClassSubject;
use App\Models\Evaluation;
use App\Models\Establishment;
use App\Models\Grade;
use App\Models\Level;
use App\Models\Role;
use App\Models\SchoolClass;
use App\Models\Subject;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('detailed performance analysis is restricted to administration roles', function () {
    $user = User::factory()->create([
        'establishment_id' => Establishment::create([
            'name' => 'Performance Auth School',
            'code' => 'PERF-AUTH',
            'type' => 'School',
            'email' => 'performance-auth@school.test',
        ])->id,
    ]);

    $user->roles()->syncWithoutDetaching([
        Role::firstOrCreate(['name' => 'teacher'])->id,
    ]);

    $this
        ->actingAs($user)
        ->get(route('performance-analysis.index'))
        ->assertForbidden();
});

test('detailed performance analysis returns tenant scoped subject class and teacher metrics', function () {
    $establishment = Establishment::create([
        'name' => 'Performance Main',
        'code' => 'PERF-MAIN',
        'type' => 'School',
        'email' => 'performance-main@school.test',
    ]);

    $otherEstablishment = Establishment::create([
        'name' => 'Performance Other',
        'code' => 'PERF-OTHER',
        'type' => 'School',
        'email' => 'performance-other@school.test',
    ]);

    $admin = User::factory()->create([
        'establishment_id' => $establishment->id,
    ]);
    $admin->roles()->syncWithoutDetaching([
        Role::firstOrCreate(['name' => 'establishment_admin'])->id,
    ]);

    $teacherOne = createPerformanceTeacher($establishment, 'Teacher Alpha', 'alpha@perf.test');
    $teacherTwo = createPerformanceTeacher($establishment, 'Teacher Beta', 'beta@perf.test');
    $otherTeacher = createPerformanceTeacher($otherEstablishment, 'Teacher Other', 'other@perf.test');

    $classA = createPerformanceClass($establishment, 'Class A');
    $classB = createPerformanceClass($establishment, 'Class B');
    $otherClass = createPerformanceClass($otherEstablishment, 'Class Z');

    $math = Subject::create([
        'establishment_id' => $establishment->id,
        'name' => 'Mathematics',
    ]);
    $english = Subject::create([
        'establishment_id' => $establishment->id,
        'name' => 'English',
    ]);
    $physics = Subject::create([
        'establishment_id' => $otherEstablishment->id,
        'name' => 'Physics',
    ]);

    ClassSubject::create([
        'class_id' => $classA->id,
        'subject_id' => $math->id,
        'teacher_id' => $teacherOne->id,
    ]);
    ClassSubject::create([
        'class_id' => $classB->id,
        'subject_id' => $english->id,
        'teacher_id' => $teacherTwo->id,
    ]);
    ClassSubject::create([
        'class_id' => $otherClass->id,
        'subject_id' => $physics->id,
        'teacher_id' => $otherTeacher->id,
    ]);

    $studentA = createPerformanceStudent($establishment, 'student-a@perf.test');
    $studentB = createPerformanceStudent($establishment, 'student-b@perf.test');
    $studentC = createPerformanceStudent($establishment, 'student-c@perf.test');
    $otherStudent = createPerformanceStudent($otherEstablishment, 'student-other@perf.test');

    $evaluationA = Evaluation::create([
        'establishment_id' => $establishment->id,
        'class_id' => $classA->id,
        'subject_id' => $math->id,
        'title' => 'Math Exam',
        'evaluation_date' => '2026-02-10',
        'type' => 'exam',
        'coefficient' => 1,
        'max_grade' => 20,
        'created_by' => $admin->id,
        'updated_by' => $admin->id,
    ]);

    $evaluationB = Evaluation::create([
        'establishment_id' => $establishment->id,
        'class_id' => $classB->id,
        'subject_id' => $english->id,
        'title' => 'English Exam',
        'evaluation_date' => '2026-02-12',
        'type' => 'exam',
        'coefficient' => 1,
        'max_grade' => 20,
        'created_by' => $admin->id,
        'updated_by' => $admin->id,
    ]);

    $otherEvaluation = Evaluation::create([
        'establishment_id' => $otherEstablishment->id,
        'class_id' => $otherClass->id,
        'subject_id' => $physics->id,
        'title' => 'Physics Exam',
        'evaluation_date' => '2026-02-14',
        'type' => 'exam',
        'coefficient' => 1,
        'max_grade' => 20,
    ]);

    foreach ([
        [$evaluationA->id, $studentA->id, 14],
        [$evaluationA->id, $studentB->id, 10],
        [$evaluationB->id, $studentC->id, 8],
        [$otherEvaluation->id, $otherStudent->id, 19],
    ] as [$evaluationId, $studentId, $grade]) {
        Grade::create([
            'establishment_id' => $studentId === $otherStudent->id ? $otherEstablishment->id : $establishment->id,
            'evaluation_id' => $evaluationId,
            'student_id' => $studentId,
            'grade' => $grade,
            'created_by' => $admin->id,
            'updated_by' => $admin->id,
        ]);
    }

    $this
        ->actingAs($admin)
        ->get(route('performance-analysis.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('DetailedPerformance/Index')
            ->where('stats.totalSubjects', 2)
            ->where('stats.totalTeachers', 2)
            ->where('stats.globalAverage', 10.67)
            ->where('stats.successRate', 66.7)
            ->has('subjectPerformance', 2)
            ->where('subjectPerformance.0.name', 'English')
            ->where('subjectPerformance.0.average', 8.0)
            ->where('subjectPerformance.1.name', 'Mathematics')
            ->where('subjectPerformance.1.average', 12.0)
            ->has('classComparison', 2)
            ->where('teacherPerformance.0.name', 'Teacher Alpha')
            ->where('teacherPerformance.0.average', 12.0)
            ->where('teacherPerformance.0.successRate', 100.0)
            ->where('teacherPerformance.1.name', 'Teacher Beta')
            ->where('teacherPerformance.1.average', 8.0)
            ->where('teacherPerformance.1.successRate', 0.0),
        );
});

function createPerformanceClass(Establishment $establishment, string $name): SchoolClass
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

function createPerformanceTeacher(Establishment $establishment, string $name, string $email): User
{
    $teacher = User::factory()->create([
        'name' => $name,
        'email' => $email,
        'establishment_id' => $establishment->id,
    ]);

    $teacher->roles()->syncWithoutDetaching([
        Role::firstOrCreate(['name' => 'teacher'])->id,
    ]);

    return $teacher;
}

function createPerformanceStudent(Establishment $establishment, string $email): User
{
    $student = User::factory()->create([
        'email' => $email,
        'establishment_id' => $establishment->id,
    ]);

    $student->roles()->syncWithoutDetaching([
        Role::firstOrCreate(['name' => 'student'])->id,
    ]);

    \App\Models\StudentProfile::create([
        'user_id' => $student->id,
        'establishment_id' => $establishment->id,
        'student_number' => fake()->unique()->bothify('PERF-###'),
    ]);

    return $student;
}
