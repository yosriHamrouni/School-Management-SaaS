<?php

namespace Database\Seeders;

use App\Models\ClassSubject;
use App\Models\Establishment;
use App\Models\Role;
use App\Models\Schedule;
use App\Models\SchoolClass;
use App\Models\Subject;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class ScheduleSeeder extends Seeder
{
    public function run(): void
    {
        $establishment = Establishment::query()->firstOrFail();
        $subjects = Subject::query()
            ->where('establishment_id', $establishment->id)
            ->get()
            ->keyBy('name');

        $classes = SchoolClass::query()
            ->where('establishment_id', $establishment->id)
            ->orderBy('name')
            ->get();

        if ($subjects->isEmpty() || $classes->isEmpty()) {
            return;
        }

        $creator = User::query()
            ->where('email', 'admin@school-management.test')
            ->first();

        $teacherRole = Role::query()->where('name', 'teacher')->first();
        $weeklyPlan = $this->weeklyPlan();

        $this->removeLegacyGeneratedTeachers($classes, $subjects, $establishment->id);

        foreach ($classes as $schoolClass) {
            foreach ($weeklyPlan as $lesson) {
                $subject = $subjects->get($lesson['subject']);

                if (! $subject) {
                    continue;
                }

                $teacher = $this->teacherForSubject(
                    $subject->name,
                    $establishment->id,
                    $teacherRole?->id,
                );

                ClassSubject::query()->updateOrCreate(
                    [
                        'class_id' => $schoolClass->id,
                        'subject_id' => $subject->id,
                        'teacher_id' => $teacher->id,
                    ],
                    [],
                );

                Schedule::query()->updateOrCreate(
                    [
                        'establishment_id' => $establishment->id,
                        'class_id' => $schoolClass->id,
                        'day_of_week' => $lesson['day'],
                        'start_time' => $lesson['start'],
                    ],
                    [
                        'subject_id' => $subject->id,
                        'teacher_id' => $teacher->id,
                        'created_by' => $creator?->id ?? $teacher->id,
                        'end_time' => $lesson['end'],
                    ],
                );
            }
        }
    }

    /**
     * @return array<int, array{day: string, start: string, end: string, subject: string}>
     */
    private function weeklyPlan(): array
    {
        return [
            ['day' => 'Monday', 'start' => '10:15:00', 'end' => '11:15:00', 'subject' => 'Mathematics'],
            ['day' => 'Monday', 'start' => '11:20:00', 'end' => '12:20:00', 'subject' => 'English'],
            ['day' => 'Monday', 'start' => '13:30:00', 'end' => '14:30:00', 'subject' => 'Computer Science'],
            ['day' => 'Tuesday', 'start' => '10:15:00', 'end' => '11:15:00', 'subject' => 'Physics'],
            ['day' => 'Tuesday', 'start' => '11:20:00', 'end' => '12:20:00', 'subject' => 'History'],
            ['day' => 'Tuesday', 'start' => '13:30:00', 'end' => '14:30:00', 'subject' => 'Mathematics'],
            ['day' => 'Wednesday', 'start' => '10:15:00', 'end' => '11:15:00', 'subject' => 'English'],
            ['day' => 'Wednesday', 'start' => '11:20:00', 'end' => '12:20:00', 'subject' => 'Computer Science'],
            ['day' => 'Wednesday', 'start' => '13:30:00', 'end' => '14:30:00', 'subject' => 'Physics'],
            ['day' => 'Thursday', 'start' => '10:15:00', 'end' => '11:15:00', 'subject' => 'Mathematics'],
            ['day' => 'Thursday', 'start' => '11:20:00', 'end' => '12:20:00', 'subject' => 'History'],
            ['day' => 'Thursday', 'start' => '13:30:00', 'end' => '14:30:00', 'subject' => 'English'],
            ['day' => 'Friday', 'start' => '10:15:00', 'end' => '11:15:00', 'subject' => 'Computer Science'],
            ['day' => 'Friday', 'start' => '11:20:00', 'end' => '12:20:00', 'subject' => 'Physics'],
            ['day' => 'Friday', 'start' => '13:30:00', 'end' => '14:30:00', 'subject' => 'Mathematics'],
        ];
    }

    private function teacherForSubject(string $subjectName, int $establishmentId, ?int $teacherRoleId): User
    {
        $subjectSlug = Str::slug($subjectName);
        $email = $subjectName === 'Computer Science'
            ? 'teacher@school-management.test'
            : "teacher-{$subjectSlug}@school-management.test";

        $teacher = User::query()->updateOrCreate(
            ['email' => $email],
            [
                'establishment_id' => $establishmentId,
                'name' => $subjectName === 'Computer Science'
                    ? 'Computer Science Teacher Demo'
                    : "{$subjectName} Teacher",
                'password' => Hash::make('password'),
            ],
        );

        if ($teacherRoleId !== null) {
            $teacher->roles()->syncWithoutDetaching([$teacherRoleId]);
        }

        return $teacher;
    }

    private function removeLegacyGeneratedTeachers($classes, $subjects, int $establishmentId): void
    {
        $legacyEmails = [
            'teacher-computer-science@school-management.test',
        ];

        foreach ($classes as $schoolClass) {
            $classSlug = Str::slug($schoolClass->name);
            $legacyEmails[] = "teacher-{$classSlug}@school-management.test";

            foreach ($subjects as $subject) {
                $legacyEmails[] = "teacher-{$classSlug}-".Str::slug($subject->name).'@school-management.test';
            }
        }

        $legacyTeacherIds = User::query()
            ->where('establishment_id', $establishmentId)
            ->whereIn('email', array_unique($legacyEmails))
            ->pluck('id');

        if ($legacyTeacherIds->isEmpty()) {
            return;
        }

        Schedule::query()
            ->where('establishment_id', $establishmentId)
            ->whereIn('teacher_id', $legacyTeacherIds)
            ->delete();

        ClassSubject::query()
            ->whereIn('teacher_id', $legacyTeacherIds)
            ->delete();
    }
}
