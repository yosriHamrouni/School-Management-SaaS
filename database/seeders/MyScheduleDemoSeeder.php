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

class MyScheduleDemoSeeder extends Seeder
{
    public function run(): void
    {
        $establishment = Establishment::query()
            ->where('email', 'contact@school-management.test')
            ->first()
            ?? Establishment::query()->firstOrFail();

        $teacher = User::query()->updateOrCreate(
            ['email' => 'teacher@school-management.test'],
            [
                'establishment_id' => $establishment->id,
                'name' => 'Computer Science Teacher Demo',
                'password' => Hash::make('password'),
            ],
        );

        $teacherRoleId = Role::query()->where('name', 'teacher')->value('id');

        if ($teacherRoleId !== null) {
            $teacher->roles()->syncWithoutDetaching([$teacherRoleId]);
        }

        $creator = User::query()
            ->where('email', 'establishment-admin@school-management.test')
            ->first()
            ?? User::query()
                ->where('email', 'admin@school-management.test')
                ->first();

        $computerScience = $this->subjectByName($establishment->id, 'Computer Science');

        if (! $computerScience) {
            return;
        }

        Schedule::query()
            ->where('establishment_id', $establishment->id)
            ->where('teacher_id', $teacher->id)
            ->where('subject_id', '!=', $computerScience->id)
            ->delete();

        ClassSubject::query()
            ->where('teacher_id', $teacher->id)
            ->where('subject_id', '!=', $computerScience->id)
            ->delete();

        foreach ($this->sessions() as $session) {
            $class = $this->classByName($establishment->id, $session['class']);

            if (! $class) {
                continue;
            }

            ClassSubject::query()->updateOrCreate(
                [
                    'class_id' => $class->id,
                    'subject_id' => $computerScience->id,
                    'teacher_id' => $teacher->id,
                ],
                [],
            );

            Schedule::query()->updateOrCreate(
                [
                    'establishment_id' => $establishment->id,
                    'class_id' => $class->id,
                    'day_of_week' => $session['day'],
                    'start_time' => $session['start'],
                ],
                [
                    'subject_id' => $computerScience->id,
                    'teacher_id' => $teacher->id,
                    'created_by' => $creator?->id ?? $teacher->id,
                    'end_time' => $session['end'],
                ],
            );
        }
    }

    /**
     * @return array<int, array{class: string, day: string, start: string, end: string}>
     */
    private function sessions(): array
    {
        return [
            ['class' => 'Primary A', 'day' => 'Tuesday', 'start' => '09:10:00', 'end' => '10:10:00'],
            ['class' => 'Primary B', 'day' => 'Wednesday', 'start' => '08:00:00', 'end' => '09:00:00'],
            ['class' => 'Middle 1', 'day' => 'Thursday', 'start' => '11:20:00', 'end' => '12:20:00'],
        ];
    }

    private function classByName(int $establishmentId, string $name): ?SchoolClass
    {
        return SchoolClass::query()
            ->where('establishment_id', $establishmentId)
            ->where('name', $name)
            ->first();
    }

    private function subjectByName(int $establishmentId, string $name): ?Subject
    {
        return Subject::query()
            ->where('establishment_id', $establishmentId)
            ->where('name', $name)
            ->first();
    }
}
