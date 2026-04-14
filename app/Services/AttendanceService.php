<?php

namespace App\Services;

use App\Models\Attendance;
use App\Models\Schedule;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class AttendanceService
{
    public const REPEATED_ABSENCE_THRESHOLD = 3;

    public function teacherSchedulesQuery(User $teacher): Builder
    {
        return Schedule::query()
            ->with([
                'schoolClass:id,name',
                'subject:id,name',
            ])
            ->forEstablishment((int) $teacher->establishment_id)
            ->where('teacher_id', $teacher->id);
    }

    public function classStudents(int $classId, int $establishmentId): Collection
    {
        if (Schema::hasTable('class_students')) {
            return DB::table('class_students')
                ->join('users', 'users.id', '=', 'class_students.student_id')
                ->leftJoin('student_profiles', function ($join) use ($classId, $establishmentId) {
                    $join->on('student_profiles.user_id', '=', 'users.id')
                        ->where('student_profiles.class_id', '=', $classId)
                        ->where('student_profiles.establishment_id', '=', $establishmentId);

                    if (Schema::hasColumn('student_profiles', 'deleted_at')) {
                        $join->whereNull('student_profiles.deleted_at');
                    }
                })
                ->where('class_students.class_id', $classId)
                ->where('users.establishment_id', $establishmentId)
                ->orderBy('users.name')
                ->get([
                    'users.id',
                    'users.name',
                    'student_profiles.student_number',
                ]);
        }

        return DB::table('student_profiles')
            ->join('users', 'users.id', '=', 'student_profiles.user_id')
            ->where('student_profiles.class_id', $classId)
            ->where('student_profiles.establishment_id', $establishmentId)
            ->when(
                Schema::hasColumn('student_profiles', 'deleted_at'),
                fn ($query) => $query->whereNull('student_profiles.deleted_at'),
            )
            ->orderBy('users.name')
            ->get([
                'users.id',
                'users.name',
                'student_profiles.student_number',
            ]);
    }

    public function validStudentIdsForSchedule(Schedule $schedule): array
    {
        return $this->classStudents($schedule->class_id, $schedule->establishment_id)
            ->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->all();
    }

    public function repeatedAbsenceCountsForStudents(
        int $establishmentId,
        array $studentIds,
        ?int $teacherId = null,
    ): array {
        if ($studentIds === []) {
            return [];
        }

        return Attendance::query()
            ->selectRaw('student_id, count(*) as total_absences')
            ->forEstablishment($establishmentId)
            ->where('status', Attendance::STATUS_ABSENT)
            ->when($teacherId !== null, fn (Builder $query) => $query->forTeacher($teacherId))
            ->whereIn('student_id', $studentIds)
            ->groupBy('student_id')
            ->pluck('total_absences', 'student_id')
            ->map(fn ($count) => (int) $count)
            ->all();
    }

    public function hasRepeatedAbsences(int $absenceCount): bool
    {
        return $absenceCount >= self::REPEATED_ABSENCE_THRESHOLD;
    }
}
