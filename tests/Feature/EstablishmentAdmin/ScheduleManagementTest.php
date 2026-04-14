<?php

use App\Models\AcademicYear;
use App\Models\Establishment;
use App\Models\Level;
use App\Models\Role;
use App\Models\Schedule;
use App\Models\SchoolClass;
use App\Models\StudentProfile;
use App\Models\Subject;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('establishment admin can create a valid schedule', function () {
    $context = scheduleContext();

    $response = $this
        ->actingAs($context['admin'])
        ->post(route('establishment-admin.schedules.store'), [
            'class_id' => $context['class']->id,
            'subject_id' => $context['subject']->id,
            'teacher_id' => $context['teacher']->id,
            'day_of_week' => 'Monday',
            'start_time' => '08:00',
            'end_time' => '10:00',
        ]);

    $response
        ->assertRedirect(route('establishment-admin.schedules.index'))
        ->assertSessionHasNoErrors();

    $this->assertDatabaseHas('schedules', [
        'establishment_id' => $context['establishment']->id,
        'class_id' => $context['class']->id,
        'subject_id' => $context['subject']->id,
        'teacher_id' => $context['teacher']->id,
        'created_by' => $context['admin']->id,
        'day_of_week' => 'Monday',
        'start_time' => '08:00',
        'end_time' => '10:00',
    ]);
});

test('teacher conflicts are rejected', function () {
    $context = scheduleContext();

    Schedule::create([
        'establishment_id' => $context['establishment']->id,
        'class_id' => $context['class']->id,
        'subject_id' => $context['subject']->id,
        'teacher_id' => $context['teacher']->id,
        'created_by' => $context['admin']->id,
        'day_of_week' => 'Monday',
        'start_time' => '09:00',
        'end_time' => '10:00',
    ]);

    $secondClass = createSchoolClass($context['establishment']);

    $response = $this
        ->actingAs($context['admin'])
        ->post(route('establishment-admin.schedules.store'), [
            'class_id' => $secondClass->id,
            'subject_id' => $context['subject']->id,
            'teacher_id' => $context['teacher']->id,
            'day_of_week' => 'Monday',
            'start_time' => '09:30',
            'end_time' => '10:30',
        ]);

    $response->assertSessionHasErrors(['teacher_id']);
    expect(Schedule::count())->toBe(1);
});

test('class conflicts are rejected', function () {
    $context = scheduleContext();
    $secondTeacher = createUserWithRole($context['establishment'], 'teacher');

    Schedule::create([
        'establishment_id' => $context['establishment']->id,
        'class_id' => $context['class']->id,
        'subject_id' => $context['subject']->id,
        'teacher_id' => $context['teacher']->id,
        'created_by' => $context['admin']->id,
        'day_of_week' => 'Tuesday',
        'start_time' => '10:00',
        'end_time' => '11:00',
    ]);

    $response = $this
        ->actingAs($context['admin'])
        ->post(route('establishment-admin.schedules.store'), [
            'class_id' => $context['class']->id,
            'subject_id' => $context['subject']->id,
            'teacher_id' => $secondTeacher->id,
            'day_of_week' => 'Tuesday',
            'start_time' => '10:30',
            'end_time' => '11:30',
        ]);

    $response->assertSessionHasErrors(['class_id']);
    expect(Schedule::count())->toBe(1);
});

test('schedule operations remain isolated per establishment', function () {
    $firstContext = scheduleContext();
    $secondContext = scheduleContext('secondary');

    $schedule = Schedule::create([
        'establishment_id' => $firstContext['establishment']->id,
        'class_id' => $firstContext['class']->id,
        'subject_id' => $firstContext['subject']->id,
        'teacher_id' => $firstContext['teacher']->id,
        'created_by' => $firstContext['admin']->id,
        'day_of_week' => 'Wednesday',
        'start_time' => '08:00',
        'end_time' => '09:00',
    ]);

    $this
        ->actingAs($secondContext['admin'])
        ->get(route('establishment-admin.schedules.show', $schedule))
        ->assertForbidden();

    $this->assertDatabaseHas('schedules', [
        'id' => $schedule->id,
        'establishment_id' => $firstContext['establishment']->id,
    ]);
});

test('non establishment admins cannot access schedule crud', function () {
    $context = scheduleContext();
    $teacherUser = createUserWithRole($context['establishment'], 'teacher');

    $this
        ->actingAs($teacherUser)
        ->get(route('establishment-admin.schedules.index'))
        ->assertForbidden();
});

test('admin calendar feed returns only authorized establishment events', function () {
    $firstContext = scheduleContext();
    $secondContext = scheduleContext('feed-secondary');

    $visibleSchedule = Schedule::create([
        'establishment_id' => $firstContext['establishment']->id,
        'class_id' => $firstContext['class']->id,
        'subject_id' => $firstContext['subject']->id,
        'teacher_id' => $firstContext['teacher']->id,
        'created_by' => $firstContext['admin']->id,
        'day_of_week' => 'Monday',
        'start_time' => '08:00',
        'end_time' => '09:00',
    ]);

    Schedule::create([
        'establishment_id' => $secondContext['establishment']->id,
        'class_id' => $secondContext['class']->id,
        'subject_id' => $secondContext['subject']->id,
        'teacher_id' => $secondContext['teacher']->id,
        'created_by' => $secondContext['admin']->id,
        'day_of_week' => 'Monday',
        'start_time' => '10:00',
        'end_time' => '11:00',
    ]);

    $response = $this
        ->actingAs($firstContext['admin'])
        ->getJson(route('establishment-admin.schedules.feed', [
            'start' => '2026-04-06',
            'end' => '2026-04-13',
        ]));

    $response
        ->assertOk()
        ->assertJsonCount(1)
        ->assertJsonPath('0.id', (string) $visibleSchedule->id)
        ->assertJsonPath('0.extendedProps.class_id', $firstContext['class']->id);
});

test('teacher calendar feed only returns the connected teacher sessions', function () {
    $context = scheduleContext();
    $otherTeacher = createUserWithRole($context['establishment'], 'teacher');

    $visibleSchedule = Schedule::create([
        'establishment_id' => $context['establishment']->id,
        'class_id' => $context['class']->id,
        'subject_id' => $context['subject']->id,
        'teacher_id' => $context['teacher']->id,
        'created_by' => $context['admin']->id,
        'day_of_week' => 'Tuesday',
        'start_time' => '08:00',
        'end_time' => '09:00',
    ]);

    Schedule::create([
        'establishment_id' => $context['establishment']->id,
        'class_id' => $context['class']->id,
        'subject_id' => $context['subject']->id,
        'teacher_id' => $otherTeacher->id,
        'created_by' => $context['admin']->id,
        'day_of_week' => 'Tuesday',
        'start_time' => '09:00',
        'end_time' => '10:00',
    ]);

    $response = $this
        ->actingAs($context['teacher'])
        ->getJson(route('teacher.schedules.feed', [
            'start' => '2026-04-06',
            'end' => '2026-04-13',
        ]));

    $response
        ->assertOk()
        ->assertJsonCount(1)
        ->assertJsonPath('0.id', (string) $visibleSchedule->id)
        ->assertJsonPath('0.extendedProps.teacher_id', $context['teacher']->id);
});

test('student consultation only returns schedules for the assigned class', function () {
    $context = scheduleContext();
    $student = createUserWithRole($context['establishment'], 'student');

    StudentProfile::create([
        'user_id' => $student->id,
        'establishment_id' => $context['establishment']->id,
        'class_id' => $context['class']->id,
        'student_number' => 'STU-100',
    ]);

    $otherClass = createSchoolClass($context['establishment']);

    $visibleSchedule = Schedule::create([
        'establishment_id' => $context['establishment']->id,
        'class_id' => $context['class']->id,
        'subject_id' => $context['subject']->id,
        'teacher_id' => $context['teacher']->id,
        'created_by' => $context['admin']->id,
        'day_of_week' => 'Thursday',
        'start_time' => '08:00',
        'end_time' => '09:00',
    ]);

    Schedule::create([
        'establishment_id' => $context['establishment']->id,
        'class_id' => $otherClass->id,
        'subject_id' => $context['subject']->id,
        'teacher_id' => $context['teacher']->id,
        'created_by' => $context['admin']->id,
        'day_of_week' => 'Thursday',
        'start_time' => '09:00',
        'end_time' => '10:00',
    ]);

    $response = $this
        ->actingAs($student)
        ->get(route('student.schedules.index'));

    $response
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Student/Schedules/Index')
            ->where('className', $context['class']->name)
            ->where('calendarFeedUrl', route('student.schedules.feed')),
        );

    $this
        ->actingAs($student)
        ->getJson(route('student.schedules.feed', [
            'start' => '2026-04-06',
            'end' => '2026-04-13',
        ]))
        ->assertOk()
        ->assertJsonCount(1)
        ->assertJsonPath('0.id', (string) $visibleSchedule->id);
});

function scheduleContext(string $suffix = 'default'): array
{
    $establishment = Establishment::create([
        'name' => "Establishment {$suffix}",
        'code' => "EST-{$suffix}",
        'type' => 'School',
        'email' => "{$suffix}@school.test",
    ]);

    $admin = createUserWithRole($establishment, 'establishment_admin');
    $teacher = createUserWithRole($establishment, 'teacher');
    $class = createSchoolClass($establishment);
    $subject = Subject::create([
        'establishment_id' => $establishment->id,
        'name' => "Subject {$suffix}",
    ]);

    return compact('establishment', 'admin', 'teacher', 'class', 'subject');
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
