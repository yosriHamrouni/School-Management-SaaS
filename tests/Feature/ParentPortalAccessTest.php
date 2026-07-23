<?php

use App\Models\AcademicYear;
use App\Models\Establishment;
use App\Models\Evaluation;
use App\Models\Grade;
use App\Models\Role;
use App\Models\Schedule;
use App\Models\SchoolClass;
use App\Models\StudentProfile;
use App\Models\Subject;
use App\Models\Term;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('parent dashboard calculates the linked child average through evaluations', function () {
    $context = parentPortalContext('dashboard');

    $this
        ->actingAs($context['parent'])
        ->get(route('dashboard', ['student' => $context['student']->id]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('dashboard')
            ->where('parentDashboard.selected_student_id', $context['student']->id)
            ->where('parentDashboard.student.summary.average', 15),
        );
});

test('parent can only view reports for linked children', function () {
    $context = parentPortalContext();

    $response = $this
        ->actingAs($context['parent'])
        ->get(route('parent.reports.index', ['student' => $context['student']->id]));

    $response
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Parent/Reports/Index')
            ->where('selectedChildId', $context['student']->id)
            ->has('children', 1),
        );
});

test('parent cannot view reports for unlinked children', function () {
    $first = parentPortalContext('first');
    $second = parentPortalContext('second');

    $this
        ->actingAs($first['parent'])
        ->get(route('parent.reports.index', ['student' => $second['student']->id]))
        ->assertForbidden();
});

test('parent schedule feed only returns linked child class events', function () {
    $context = parentPortalContext('schedule');
    $otherClass = createParentPortalSchoolClass($context['establishment'], 'Other Class');

    $visibleSchedule = Schedule::create([
        'establishment_id' => $context['establishment']->id,
        'class_id' => $context['class']->id,
        'subject_id' => $context['subject']->id,
        'teacher_id' => $context['teacher']->id,
        'created_by' => $context['admin']->id,
        'day_of_week' => 'Monday',
        'start_time' => '08:00',
        'end_time' => '09:00',
    ]);

    Schedule::create([
        'establishment_id' => $context['establishment']->id,
        'class_id' => $otherClass->id,
        'subject_id' => $context['subject']->id,
        'teacher_id' => $context['teacher']->id,
        'created_by' => $context['admin']->id,
        'day_of_week' => 'Monday',
        'start_time' => '09:00',
        'end_time' => '10:00',
    ]);

    $this
        ->actingAs($context['parent'])
        ->getJson(route('parent.schedules.feed', [
            'student' => $context['student']->id,
            'start' => '2026-04-06',
            'end' => '2026-04-13',
        ]))
        ->assertOk()
        ->assertJsonCount(1)
        ->assertJsonPath('0.id', (string) $visibleSchedule->id)
        ->assertJsonPath('0.extendedProps.class_id', $context['class']->id);
});

function parentPortalContext(string $suffix = 'default'): array
{
    $establishment = Establishment::create([
        'name' => "Parent Portal {$suffix}",
        'code' => "PP-{$suffix}",
        'type' => 'School',
        'email' => "{$suffix}-parent-portal@school.test",
    ]);

    $admin = createParentPortalUser($establishment, 'establishment_admin');
    $teacher = createParentPortalUser($establishment, 'teacher');
    $parent = createParentPortalUser($establishment, 'parent');
    $student = createParentPortalUser($establishment, 'student');
    $class = createParentPortalSchoolClass($establishment, 'Portal Class');
    $subject = Subject::create([
        'establishment_id' => $establishment->id,
        'name' => "Mathematics {$suffix}",
    ]);

    $term = Term::create([
        'establishment_id' => $establishment->id,
        'academic_year_id' => $class->academic_year_id,
        'name' => "Term {$suffix}",
    ]);

    StudentProfile::create([
        'user_id' => $student->id,
        'establishment_id' => $establishment->id,
        'class_id' => $class->id,
        'student_number' => "PAR-{$suffix}",
    ]);

    $parent->children()->syncWithoutDetaching([$student->studentProfile->id]);

    $evaluation = Evaluation::create([
        'establishment_id' => $establishment->id,
        'class_id' => $class->id,
        'subject_id' => $subject->id,
        'term_id' => $term->id,
        'title' => "Evaluation {$suffix}",
        'type' => 'exam',
        'coefficient' => 2,
        'max_grade' => 20,
        'evaluation_date' => '2026-04-10',
        'created_by' => $teacher->id,
        'updated_by' => $teacher->id,
    ]);

    Grade::create([
        'evaluation_id' => $evaluation->id,
        'student_id' => $student->id,
        'grade' => 15,
        'remarks' => 'Good',
    ]);

    return compact('establishment', 'admin', 'teacher', 'parent', 'student', 'class', 'subject', 'term');
}

function createParentPortalUser(Establishment $establishment, string $roleName): User
{
    $user = User::factory()->create([
        'establishment_id' => $establishment->id,
    ]);

    $role = Role::firstOrCreate(['name' => $roleName]);
    $user->roles()->syncWithoutDetaching([$role->id]);

    return $user;
}

function createParentPortalSchoolClass(Establishment $establishment, string $name): SchoolClass
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

    return SchoolClass::create([
        'establishment_id' => $establishment->id,
        'academic_year_id' => $academicYear->id,
        'level_id' => \App\Models\Level::create([
            'establishment_id' => $establishment->id,
            'name' => fake()->unique()->word(),
        ])->id,
        'name' => $name,
    ]);
}
