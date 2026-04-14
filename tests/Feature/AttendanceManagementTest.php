<?php

use App\Models\AcademicYear;
use App\Models\Attendance;
use App\Models\ClassSubject;
use App\Models\Establishment;
use App\Models\Level;
use App\Models\Role;
use App\Models\Schedule;
use App\Models\SchoolClass;
use App\Models\StudentProfile;
use App\Models\Subject;
use App\Models\User;
use App\Services\AttendanceService;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;

test('teacher can open attendance page and save attendance in bulk for own schedule', function () {
    $context = attendanceContext();

    $this
        ->actingAs($context['teacher'])
        ->get(route('teacher.attendances.edit', $context['schedule']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Teacher/Attendances/Edit')
            ->where('schedule.id', $context['schedule']->id)
            ->has('students', 2),
        );

    $this
        ->actingAs($context['teacher'])
        ->post(route('teacher.attendances.store'), [
            'schedule_id' => $context['schedule']->id,
            'students' => [
                [
                    'student_id' => $context['student']->id,
                    'status' => Attendance::STATUS_ABSENT,
                    'justification' => 'Medical appointment',
                ],
                [
                    'student_id' => $context['second_student']->id,
                    'status' => Attendance::STATUS_PRESENT,
                    'justification' => '',
                ],
            ],
        ])
        ->assertRedirect(route('teacher.attendances.edit', $context['schedule']))
        ->assertSessionHasNoErrors();

    $this->assertDatabaseHas('attendances', [
        'schedule_id' => $context['schedule']->id,
        'student_id' => $context['student']->id,
        'teacher_id' => $context['teacher']->id,
        'status' => Attendance::STATUS_ABSENT,
        'justification' => 'Medical appointment',
    ]);

    $this
        ->actingAs($context['teacher'])
        ->post(route('teacher.attendances.store'), [
            'schedule_id' => $context['schedule']->id,
            'students' => [
                [
                    'student_id' => $context['student']->id,
                    'status' => Attendance::STATUS_LATE,
                    'justification' => 'Bus delay',
                ],
                [
                    'student_id' => $context['second_student']->id,
                    'status' => Attendance::STATUS_PRESENT,
                    'justification' => '',
                ],
            ],
        ])
        ->assertRedirect(route('teacher.attendances.edit', $context['schedule']))
        ->assertSessionHasNoErrors();

    expect(Attendance::query()
        ->where('schedule_id', $context['schedule']->id)
        ->where('student_id', $context['student']->id)
        ->count())->toBe(1);

    $this->assertDatabaseHas('attendances', [
        'schedule_id' => $context['schedule']->id,
        'student_id' => $context['student']->id,
        'status' => Attendance::STATUS_LATE,
        'justification' => 'Bus delay',
    ]);
});

test('teacher cannot record attendance for another teachers schedule', function () {
    $context = attendanceContext();
    $otherSchedule = Schedule::create([
        'establishment_id' => $context['establishment']->id,
        'class_id' => $context['class']->id,
        'subject_id' => $context['subject']->id,
        'teacher_id' => $context['other_teacher']->id,
        'created_by' => $context['admin']->id,
        'day_of_week' => 'Tuesday',
        'start_time' => '10:00',
        'end_time' => '11:00',
    ]);

    $this
        ->actingAs($context['teacher'])
        ->post(route('teacher.attendances.store'), [
            'schedule_id' => $otherSchedule->id,
            'students' => [
                [
                    'student_id' => $context['student']->id,
                    'status' => Attendance::STATUS_PRESENT,
                    'justification' => '',
                ],
            ],
        ])
        ->assertSessionHasErrors(['schedule_id']);

    $this
        ->actingAs($context['teacher'])
        ->get(route('teacher.attendances.edit', $otherSchedule))
        ->assertForbidden();
});

test('attendance validation rejects students outside the schedules class', function () {
    $context = attendanceContext();
    $otherClass = createAttendanceSchoolClass($context['establishment']);
    $outsideStudent = createAttendanceStudent($context['establishment'], $otherClass, 'EXT');

    $this
        ->actingAs($context['teacher'])
        ->post(route('teacher.attendances.store'), [
            'schedule_id' => $context['schedule']->id,
            'students' => [
                [
                    'student_id' => $outsideStudent->id,
                    'status' => Attendance::STATUS_ABSENT,
                    'justification' => 'Invalid',
                ],
            ],
        ])
        ->assertSessionHasErrors(['students.0.student_id']);

    $this->assertDatabaseMissing('attendances', [
        'schedule_id' => $context['schedule']->id,
        'student_id' => $outsideStudent->id,
    ]);
});

test('attendance history flags repeated absences and remains tenant isolated', function () {
    $firstContext = attendanceContext('one');
    $secondContext = attendanceContext('two');

    $extraScheduleOne = createAttendanceSchedule($firstContext['establishment'], $firstContext['class'], $firstContext['subject'], $firstContext['teacher'], $firstContext['admin'], 'Tuesday', '10:00', '11:00');
    $extraScheduleTwo = createAttendanceSchedule($firstContext['establishment'], $firstContext['class'], $firstContext['subject'], $firstContext['teacher'], $firstContext['admin'], 'Wednesday', '11:00', '12:00');

    foreach ([$firstContext['schedule'], $extraScheduleOne, $extraScheduleTwo] as $schedule) {
        Attendance::create([
            'establishment_id' => $firstContext['establishment']->id,
            'schedule_id' => $schedule->id,
            'student_id' => $firstContext['student']->id,
            'teacher_id' => $firstContext['teacher']->id,
            'status' => Attendance::STATUS_ABSENT,
            'justification' => 'Repeated absence',
            'recorded_at' => now(),
        ]);
    }

    $this
        ->actingAs($firstContext['teacher'])
        ->get(route('teacher.attendances.history'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Teacher/Attendances/History')
            ->where('summary.absent', 3)
            ->where('repeatedAbsenceThreshold', AttendanceService::REPEATED_ABSENCE_THRESHOLD)
            ->where('attendances.data.0.has_repeated_absences', true),
        );

    $this
        ->actingAs($secondContext['teacher'])
        ->get(route('teacher.attendances.edit', $firstContext['schedule']))
        ->assertForbidden();

    $this
        ->actingAs($secondContext['teacher'])
        ->get(route('teacher.attendances.history'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Teacher/Attendances/History')
            ->where('summary.total', 0),
        );
});

function attendanceContext(string $suffix = 'default'): array
{
    $establishment = Establishment::create([
        'name' => "Attendance {$suffix}",
        'code' => "ATT-{$suffix}",
        'type' => 'School',
        'email' => "{$suffix}-attendance@school.test",
    ]);

    $admin = createAttendanceUserWithRole($establishment, 'establishment_admin');
    $teacher = createAttendanceUserWithRole($establishment, 'teacher');
    $otherTeacher = createAttendanceUserWithRole($establishment, 'teacher');
    $class = createAttendanceSchoolClass($establishment);
    $subject = Subject::create([
        'establishment_id' => $establishment->id,
        'name' => "Mathematics {$suffix}",
    ]);

    ClassSubject::create([
        'class_id' => $class->id,
        'subject_id' => $subject->id,
        'teacher_id' => $teacher->id,
    ]);

    $schedule = createAttendanceSchedule($establishment, $class, $subject, $teacher, $admin);
    $student = createAttendanceStudent($establishment, $class, 'STD-A');
    $secondStudent = createAttendanceStudent($establishment, $class, 'STD-B');

    return compact(
        'establishment',
        'admin',
        'teacher',
        'otherTeacher',
        'class',
        'subject',
        'schedule',
        'student',
        'secondStudent',
    ) + [
        'other_teacher' => $otherTeacher,
        'second_student' => $secondStudent,
    ];
}

function createAttendanceUserWithRole(Establishment $establishment, string $roleName): User
{
    $user = User::factory()->create([
        'establishment_id' => $establishment->id,
    ]);

    $role = Role::firstOrCreate(['name' => $roleName]);
    $user->roles()->syncWithoutDetaching([$role->id]);

    return $user;
}

function createAttendanceSchoolClass(Establishment $establishment): SchoolClass
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

function createAttendanceSchedule(
    Establishment $establishment,
    SchoolClass $class,
    Subject $subject,
    User $teacher,
    User $creator,
    string $dayOfWeek = 'Monday',
    string $startTime = '08:00',
    string $endTime = '09:00',
): Schedule {
    return Schedule::create([
        'establishment_id' => $establishment->id,
        'class_id' => $class->id,
        'subject_id' => $subject->id,
        'teacher_id' => $teacher->id,
        'created_by' => $creator->id,
        'day_of_week' => $dayOfWeek,
        'start_time' => $startTime,
        'end_time' => $endTime,
    ]);
}

function createAttendanceStudent(Establishment $establishment, SchoolClass $class, string $prefix): User
{
    $student = createAttendanceUserWithRole($establishment, 'student');

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
