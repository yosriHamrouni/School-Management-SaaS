<?php

use App\Models\AcademicYear;
use App\Models\ClassSubject;
use App\Models\Establishment;
use App\Models\Level;
use App\Models\Role;
use App\Models\SchoolClass;
use App\Models\Subject;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('teacher can view only assigned classes', function () {
    $establishment = Establishment::create([
        'name' => 'Teacher Classes School',
        'code' => 'TCS-1',
        'type' => 'School',
        'email' => 'teacher-classes@test.local',
    ]);

    $teacher = createTeacherClassesUserWithRole($establishment, 'teacher');
    $otherTeacher = createTeacherClassesUserWithRole($establishment, 'teacher');

    $classA = createTeacherClassesSchoolClass($establishment, 'Class A');
    $classB = createTeacherClassesSchoolClass($establishment, 'Class B');

    $subjectMath = Subject::create([
        'establishment_id' => $establishment->id,
        'name' => 'Mathematics',
    ]);
    $subjectEnglish = Subject::create([
        'establishment_id' => $establishment->id,
        'name' => 'English',
    ]);

    ClassSubject::create([
        'class_id' => $classA->id,
        'subject_id' => $subjectMath->id,
        'teacher_id' => $teacher->id,
    ]);
    ClassSubject::create([
        'class_id' => $classA->id,
        'subject_id' => $subjectEnglish->id,
        'teacher_id' => $teacher->id,
    ]);
    ClassSubject::create([
        'class_id' => $classB->id,
        'subject_id' => $subjectMath->id,
        'teacher_id' => $otherTeacher->id,
    ]);

    $this
        ->actingAs($teacher)
        ->get(route('teacher.classes.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Teacher/Classes/Index')
            ->has('classes', 1)
            ->where('classes.0.name', 'Class A')
            ->has('classes.0.subjects', 2),
        );
});

function createTeacherClassesUserWithRole(Establishment $establishment, string $roleName): User
{
    $user = User::factory()->create([
        'establishment_id' => $establishment->id,
    ]);

    $role = Role::firstOrCreate(['name' => $roleName]);
    $user->roles()->syncWithoutDetaching([$role->id]);

    return $user;
}

function createTeacherClassesSchoolClass(Establishment $establishment, string $name): SchoolClass
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
        'name' => $name,
    ]);
}
