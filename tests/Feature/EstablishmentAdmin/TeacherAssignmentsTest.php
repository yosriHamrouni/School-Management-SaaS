<?php

use App\Models\AcademicYear;
use App\Models\Establishment;
use App\Models\Level;
use App\Models\Role;
use App\Models\SchoolClass;
use App\Models\Subject;
use App\Models\User;

test('establishment admin can create a teacher with class subject assignments', function () {
    $establishment = Establishment::create([
        'name' => 'Teacher Assignment School',
        'code' => 'TAS-1',
        'type' => 'School',
        'email' => 'tas@test.local',
    ]);

    $admin = createTeacherAssignmentUserWithRole($establishment, 'establishment_admin');
    $class = createTeacherAssignmentClass($establishment);
    $subjectA = Subject::create([
        'establishment_id' => $establishment->id,
        'name' => 'Math',
    ]);
    $subjectB = Subject::create([
        'establishment_id' => $establishment->id,
        'name' => 'English',
    ]);

    $response = $this
        ->actingAs($admin)
        ->post(route('establishment-admin.teachers.store'), [
            'name' => 'Teacher Assignments',
            'email' => 'assigned-teacher@test.local',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'assignments' => [
                "{$class->id}:{$subjectA->id}",
                "{$class->id}:{$subjectB->id}",
            ],
        ]);

    $response
        ->assertRedirect(route('establishment-admin.teachers.index'))
        ->assertSessionHasNoErrors();

    $teacher = User::query()->where('email', 'assigned-teacher@test.local')->firstOrFail();

    $this->assertDatabaseHas('class_subjects', [
        'class_id' => $class->id,
        'subject_id' => $subjectA->id,
        'teacher_id' => $teacher->id,
    ]);

    $this->assertDatabaseHas('class_subjects', [
        'class_id' => $class->id,
        'subject_id' => $subjectB->id,
        'teacher_id' => $teacher->id,
    ]);
});

function createTeacherAssignmentUserWithRole(Establishment $establishment, string $roleName): User
{
    $user = User::factory()->create([
        'establishment_id' => $establishment->id,
    ]);

    $role = Role::firstOrCreate(['name' => $roleName]);
    $user->roles()->syncWithoutDetaching([$role->id]);

    return $user;
}

function createTeacherAssignmentClass(Establishment $establishment): SchoolClass
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
