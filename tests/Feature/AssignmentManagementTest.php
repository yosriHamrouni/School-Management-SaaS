<?php

use App\Models\AcademicYear;
use App\Models\Assignment;
use App\Models\ClassSubject;
use App\Models\Establishment;
use App\Models\Level;
use App\Models\Role;
use App\Models\SchoolClass;
use App\Models\StudentProfile;
use App\Models\Subject;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('teacher can create an assignment for an assigned class subject and notify class students', function () {
    $context = assignmentContext();

    $response = $this
        ->actingAs($context['teacher'])
        ->post(route('teacher.assignments.store'), [
            'class_id' => $context['class']->id,
            'subject_id' => $context['subject']->id,
            'title' => 'Homework 1',
            'description' => 'Solve exercises 1 to 10.',
            'due_date' => now()->addDays(3)->format('Y-m-d'),
        ]);

    $response
        ->assertRedirect(route('teacher.assignments.index'))
        ->assertSessionHasNoErrors();

    $assignment = Assignment::query()->firstOrFail();

    expect($assignment->establishment_id)->toBe($context['establishment']->id)
        ->and($assignment->academic_year_id)->toBe($context['academic_year']->id)
        ->and($assignment->class_id)->toBe($context['class']->id)
        ->and($assignment->subject_id)->toBe($context['subject']->id);

    $this->assertDatabaseCount('notifications', 2);
    $this->assertDatabaseHas('notifications', [
        'notifiable_type' => User::class,
        'notifiable_id' => $context['student']->id,
        'type' => \App\Notifications\AcademicEventNotification::class,
    ]);
    $this->assertDatabaseHas('notifications', [
        'notifiable_type' => User::class,
        'notifiable_id' => $context['second_student']->id,
        'type' => \App\Notifications\AcademicEventNotification::class,
    ]);
});

test('teacher cannot create an assignment for an unassigned class subject', function () {
    $context = assignmentContext();
    $otherClass = createAssignmentSchoolClass($context['establishment']);

    $this
        ->actingAs($context['teacher'])
        ->post(route('teacher.assignments.store'), [
            'class_id' => $otherClass->id,
            'subject_id' => $context['subject']->id,
            'title' => 'Forbidden assignment',
            'description' => 'This should fail.',
            'due_date' => now()->addDays(2)->format('Y-m-d'),
        ])
        ->assertSessionHasErrors(['subject_id']);

    $this->assertDatabaseCount('assignments', 0);
    $this->assertDatabaseCount('notifications', 0);
});

test('assignment listing is isolated per establishment', function () {
    $firstContext = assignmentContext('primary');
    $secondContext = assignmentContext('secondary');

    Assignment::create([
        'establishment_id' => $firstContext['establishment']->id,
        'academic_year_id' => $firstContext['academic_year']->id,
        'class_id' => $firstContext['class']->id,
        'subject_id' => $firstContext['subject']->id,
        'title' => 'Visible here only',
        'description' => 'Tenant isolated',
        'due_date' => now()->addDays(1)->format('Y-m-d'),
    ]);

    $this
        ->actingAs($secondContext['teacher'])
        ->get(route('teacher.assignments.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Teacher/Assignments/Index')
            ->where('assignments.data', []),
        );
});

test('teacher cannot edit or delete an assignment outside assigned perimeter', function () {
    $context = assignmentContext();
    $otherTeacher = createAssignmentUserWithRole($context['establishment'], 'teacher');
    $otherSubject = Subject::create([
        'establishment_id' => $context['establishment']->id,
        'name' => 'Physics',
    ]);

    $assignment = Assignment::create([
        'establishment_id' => $context['establishment']->id,
        'academic_year_id' => $context['academic_year']->id,
        'class_id' => $context['class']->id,
        'subject_id' => $otherSubject->id,
        'title' => 'Protected assignment',
        'description' => 'Restricted',
        'due_date' => now()->addDays(5)->format('Y-m-d'),
    ]);

    $this
        ->actingAs($otherTeacher)
        ->get(route('teacher.assignments.edit', $assignment))
        ->assertForbidden();

    $this
        ->actingAs($otherTeacher)
        ->put(route('teacher.assignments.update', $assignment), [
            'class_id' => $context['class']->id,
            'subject_id' => $otherSubject->id,
            'title' => 'Updated title',
            'description' => 'Should fail',
            'due_date' => now()->addDays(10)->format('Y-m-d'),
        ])
        ->assertForbidden();

    $this
        ->actingAs($otherTeacher)
        ->delete(route('teacher.assignments.destroy', $assignment))
        ->assertForbidden();

    $this->assertDatabaseHas('assignments', [
        'id' => $assignment->id,
        'title' => 'Protected assignment',
    ]);
});

test('teacher cannot create assignment when no active academic year exists', function () {
    $context = assignmentContext();
    $context['academic_year']->update([
        'status' => 'inactive',
        'is_current' => false,
    ]);

    $this
        ->actingAs($context['teacher'])
        ->post(route('teacher.assignments.store'), [
            'class_id' => $context['class']->id,
            'subject_id' => $context['subject']->id,
            'title' => 'No active year',
            'description' => 'Should fail',
            'due_date' => now()->addDays(2)->format('Y-m-d'),
        ])
        ->assertSessionHasErrors(['class_id']);
});

function assignmentContext(string $suffix = 'default'): array
{
    $establishment = Establishment::create([
        'name' => "Assignment {$suffix}",
        'code' => "ASN-{$suffix}",
        'type' => 'School',
        'email' => "{$suffix}-assignment@school.test",
    ]);

    $teacher = createAssignmentUserWithRole($establishment, 'teacher');
    $class = createAssignmentSchoolClass($establishment);
    $subject = Subject::create([
        'establishment_id' => $establishment->id,
        'name' => "Mathematics {$suffix}",
    ]);

    ClassSubject::create([
        'class_id' => $class->id,
        'subject_id' => $subject->id,
        'teacher_id' => $teacher->id,
    ]);

    $student = createAssignmentStudent($establishment, $class, $class->academic_year_id, 'ASN-A');
    $secondStudent = createAssignmentStudent($establishment, $class, $class->academic_year_id, 'ASN-B');

    return [
        'establishment' => $establishment,
        'teacher' => $teacher,
        'class' => $class,
        'subject' => $subject,
        'student' => $student,
        'second_student' => $secondStudent,
        'academic_year' => AcademicYear::query()->findOrFail($class->academic_year_id),
    ];
}

function createAssignmentUserWithRole(Establishment $establishment, string $roleName): User
{
    $user = User::factory()->create([
        'establishment_id' => $establishment->id,
    ]);

    $role = Role::firstOrCreate(['name' => $roleName]);
    $user->roles()->syncWithoutDetaching([$role->id]);

    return $user;
}

function createAssignmentSchoolClass(Establishment $establishment): SchoolClass
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

function createAssignmentStudent(
    Establishment $establishment,
    SchoolClass $class,
    int $academicYearId,
    string $prefix,
): User {
    $student = createAssignmentUserWithRole($establishment, 'student');

    StudentProfile::create([
        'user_id' => $student->id,
        'establishment_id' => $establishment->id,
        'class_id' => $class->id,
        'student_number' => fake()->unique()->bothify("{$prefix}-###"),
    ]);

    $payload = [
        'class_id' => $class->id,
        'student_id' => $student->id,
        'created_at' => now(),
        'updated_at' => now(),
    ];

    if (\Illuminate\Support\Facades\Schema::hasColumn('class_students', 'academic_year_id')) {
        $payload['academic_year_id'] = $academicYearId;
    }

    if (\Illuminate\Support\Facades\Schema::hasColumn('class_students', 'establishment_id')) {
        $payload['establishment_id'] = $establishment->id;
    }

    \Illuminate\Support\Facades\DB::table('class_students')->insert($payload);

    return $student;
}
