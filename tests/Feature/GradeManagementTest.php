<?php

use App\Models\AcademicYear;
use App\Models\ClassSubject;
use App\Models\Establishment;
use App\Models\Evaluation;
use App\Models\Grade;
use App\Models\Level;
use App\Models\Role;
use App\Models\SchoolClass;
use App\Models\StudentProfile;
use App\Models\Subject;
use App\Models\Term;
use App\Models\User;
use App\Services\GradeService;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;

test('teacher can create an evaluation for an assigned class subject', function () {
    $context = gradeContext();

    $response = $this
        ->actingAs($context['teacher'])
        ->post(route('evaluations.store'), [
            'title' => 'Math Quiz 1',
            'class_id' => $context['class']->id,
            'subject_id' => $context['subject']->id,
            'term_id' => $context['term']->id,
            'type' => 'quiz',
            'coefficient' => '2',
            'max_grade' => '20',
            'evaluation_date' => '2026-04-10',
            'description' => 'First quiz',
        ]);

    $response
        ->assertRedirect(route('evaluations.index'))
        ->assertSessionHasNoErrors();

    $this->assertDatabaseHas('evaluations', [
        'establishment_id' => $context['establishment']->id,
        'class_id' => $context['class']->id,
        'subject_id' => $context['subject']->id,
        'term_id' => $context['term']->id,
        'created_by' => $context['teacher']->id,
    ]);
});

test('teacher can save grades in bulk and averages are calculated on backend', function () {
    $context = gradeContext();

    $evaluation = Evaluation::create([
        'establishment_id' => $context['establishment']->id,
        'class_id' => $context['class']->id,
        'subject_id' => $context['subject']->id,
        'term_id' => $context['term']->id,
        'title' => 'Semester Test',
        'evaluation_date' => '2026-04-11',
        'type' => 'exam',
        'coefficient' => 2,
        'max_grade' => 20,
        'created_by' => $context['teacher']->id,
        'updated_by' => $context['teacher']->id,
    ]);

    $response = $this
        ->actingAs($context['teacher'])
        ->post(route('evaluations.grades.store', $evaluation), [
            'grades' => [
                ['student_id' => $context['student']->id, 'grade' => '15', 'remarks' => 'Good'],
                ['student_id' => $context['second_student']->id, 'grade' => '12', 'remarks' => 'Can improve'],
            ],
        ]);

    $response
        ->assertRedirect(route('evaluations.grades.edit', $evaluation))
        ->assertSessionHasNoErrors();

    $this->assertDatabaseHas('grades', [
        'evaluation_id' => $evaluation->id,
        'student_id' => $context['student']->id,
        'grade' => '15.00',
    ]);

    $service = app(GradeService::class);

    expect($service->calculateStudentAverage(
        $context['student']->id,
        $context['subject']->id,
        $context['term']->id,
    ))->toBe(15.0);
});

test('grade is rejected when the student does not belong to the evaluation class', function () {
    $context = gradeContext();
    $otherStudent = createStudent($context['establishment'], createSchoolClass($context['establishment']));

    $evaluation = Evaluation::create([
        'establishment_id' => $context['establishment']->id,
        'class_id' => $context['class']->id,
        'subject_id' => $context['subject']->id,
        'term_id' => $context['term']->id,
        'title' => 'Protected Quiz',
        'evaluation_date' => '2026-04-12',
        'type' => 'quiz',
        'coefficient' => 1,
        'max_grade' => 20,
        'created_by' => $context['teacher']->id,
        'updated_by' => $context['teacher']->id,
    ]);

    $this
        ->actingAs($context['teacher'])
        ->post(route('evaluations.grades.store', $evaluation), [
            'grades' => [
                ['student_id' => $otherStudent->id, 'grade' => '14'],
            ],
        ])
        ->assertSessionHasErrors(['grades.0.student_id']);
});

test('teacher cannot create an evaluation outside assigned class subject', function () {
    $context = gradeContext();
    $otherClass = createSchoolClass($context['establishment']);

    $this
        ->actingAs($context['teacher'])
        ->post(route('evaluations.store'), [
            'title' => 'Forbidden evaluation',
            'class_id' => $otherClass->id,
            'subject_id' => $context['subject']->id,
            'term_id' => $context['term']->id,
            'type' => 'exam',
            'coefficient' => '1',
            'max_grade' => '20',
            'evaluation_date' => '2026-04-13',
        ])
        ->assertSessionHasErrors(['subject_id']);
});

test('students cannot access evaluation management routes', function () {
    $context = gradeContext();

    $this
        ->actingAs($context['student'])
        ->get(route('evaluations.index'))
        ->assertForbidden();
});

test('report and evaluations remain isolated per establishment', function () {
    $firstContext = gradeContext('primary');
    $secondContext = gradeContext('secondary');

    $evaluation = Evaluation::create([
        'establishment_id' => $firstContext['establishment']->id,
        'class_id' => $firstContext['class']->id,
        'subject_id' => $firstContext['subject']->id,
        'term_id' => $firstContext['term']->id,
        'title' => 'Visible only here',
        'evaluation_date' => '2026-04-14',
        'type' => 'exam',
        'coefficient' => 1,
        'max_grade' => 20,
        'created_by' => $firstContext['teacher']->id,
        'updated_by' => $firstContext['teacher']->id,
    ]);

    $this
        ->actingAs($secondContext['admin'])
        ->get(route('evaluations.edit', $evaluation))
        ->assertForbidden();

    $this
        ->actingAs($secondContext['admin'])
        ->get(route('reports.student.show', $firstContext['student']->id, [
            'term_id' => $firstContext['term']->id,
        ]))
        ->assertForbidden();
});

test('teacher can open grade entry page for own evaluation', function () {
    $context = gradeContext();

    $evaluation = Evaluation::create([
        'establishment_id' => $context['establishment']->id,
        'class_id' => $context['class']->id,
        'subject_id' => $context['subject']->id,
        'term_id' => $context['term']->id,
        'title' => 'Open grades',
        'evaluation_date' => '2026-04-15',
        'type' => 'exam',
        'coefficient' => 1,
        'max_grade' => 20,
        'created_by' => $context['teacher']->id,
        'updated_by' => $context['teacher']->id,
    ]);

    $this
        ->actingAs($context['teacher'])
        ->get(route('evaluations.grades.edit', $evaluation))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Grades/Edit')
            ->where('evaluation.id', $evaluation->id)
            ->has('students', 2),
        );
});

function gradeContext(string $suffix = 'default'): array
{
    $establishment = Establishment::create([
        'name' => "Establishment {$suffix}",
        'code' => "GRD-{$suffix}",
        'type' => 'School',
        'email' => "{$suffix}-grades@school.test",
    ]);

    $admin = createUserWithRole($establishment, 'establishment_admin');
    $teacher = createUserWithRole($establishment, 'teacher');
    $class = createSchoolClass($establishment);
    $subject = Subject::create([
        'establishment_id' => $establishment->id,
        'name' => "Mathematics {$suffix}",
    ]);
    $term = Term::create([
        'establishment_id' => $establishment->id,
        'academic_year_id' => $class->academic_year_id,
        'name' => "Term {$suffix}",
        'start_date' => '2026-01-01',
        'end_date' => '2026-03-31',
    ]);

    ClassSubject::create([
        'class_id' => $class->id,
        'subject_id' => $subject->id,
        'teacher_id' => $teacher->id,
    ]);

    $student = createStudent($establishment, $class, 'STU-A');
    $secondStudent = createStudent($establishment, $class, 'STU-B');

    return compact(
        'establishment',
        'admin',
        'teacher',
        'class',
        'subject',
        'term',
        'student',
        'secondStudent',
    ) + ['second_student' => $secondStudent];
}

function createStudent(Establishment $establishment, SchoolClass $class, string $prefix = 'STU'): User
{
    $student = createUserWithRole($establishment, 'student');

    StudentProfile::create([
        'user_id' => $student->id,
        'establishment_id' => $establishment->id,
        'class_id' => $class->id,
        'student_number' => fake()->unique()->bothify("{$prefix}-###"),
    ]);

    DB::table('class_students')->insert([
        'class_id' => $class->id,
        'student_id' => $student->id,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    return $student;
}

function createUserWithRole(Establishment $establishment, string $roleName): User
{
    $user = User::factory()->create([
        'establishment_id' => $establishment->id,
    ]);

    $role = Role::firstOrCreate(['name' => $roleName]);
    $user->roles()->syncWithoutDetaching([$role->id]);

    return $user;
}

function createSchoolClass(Establishment $establishment): SchoolClass
{
    $academicYear = AcademicYear::firstOrCreate([
        'establishment_id' => $establishment->id,
        'name' => '2025-2026',
    ], [
        'establishment_id' => $establishment->id,
        'name' => '2025-2026',
        'start_date' => '2025-09-01',
        'end_date' => '2026-06-30',
        'status' => 'active',
        'is_current' => true,
    ]);

    $level = Level::create([
        'establishment_id' => $establishment->id,
        'name' => fake()->unique()->word(),
    ]);

    return SchoolClass::create([
        'establishment_id' => $establishment->id,
        'level_id' => $level->id,
        'academic_year_id' => $academicYear->id,
        'name' => fake()->unique()->bothify('Class-##??'),
    ]);
}
