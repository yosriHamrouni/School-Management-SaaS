<?php

namespace Database\Seeders;

use App\Models\AcademicYear;
use App\Models\Attendance;
use App\Models\Schedule;
use App\Models\SchoolClass;
use App\Models\StudentProfile;
use App\Models\StudentRiskPrediction;
use App\Models\Subject;
use App\Models\User;
use App\Services\Risk\StudentRiskAnalyzer;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Schema;

class RiskDemoSeeder extends Seeder
{
    /**
     * @var array<string, array{absences: int, lates: int}>
     */
    private const STUDENT_ATTENDANCE_PLAN = [
        'student@school-management.test' => ['absences' => 0, 'lates' => 0],
        'student2@school-management.test' => ['absences' => 4, 'lates' => 1],
        'student3@school-management.test' => ['absences' => 8, 'lates' => 2],
        'student4@school-management.test' => ['absences' => 0, 'lates' => 3],
        'student5@school-management.test' => ['absences' => 1, 'lates' => 0],
        'student6@school-management.test' => ['absences' => 9, 'lates' => 6],
    ];

    public function run(): void
    {
        if (
            ! Schema::hasTable('student_risk_predictions')
            || ! Schema::hasTable('attendances')
            || ! Schema::hasTable('schedules')
        ) {
            return;
        }

        $teacher = User::query()->where('email', 'teacher@school-management.test')->first();

        if (! $teacher || $teacher->establishment_id === null) {
            return;
        }

        $establishmentId = (int) $teacher->establishment_id;

        $academicYear = AcademicYear::query()
            ->where('establishment_id', $establishmentId)
            ->where('is_current', true)
            ->first()
            ?? AcademicYear::query()
                ->where('establishment_id', $establishmentId)
                ->latest('id')
                ->first();

        if (! $academicYear) {
            return;
        }

        $students = StudentProfile::query()
            ->with([
                'user:id,email',
                'schoolClass:id,establishment_id,academic_year_id,name',
            ])
            ->where('establishment_id', $establishmentId)
            ->whereHas('user', function ($query): void {
                $query->whereIn('email', array_keys(self::STUDENT_ATTENDANCE_PLAN));
            })
            ->get();

        if ($students->isEmpty()) {
            return;
        }

        // Keep demo seeding idempotent by rebuilding the current-year snapshots.
        StudentRiskPrediction::query()
            ->where('establishment_id', $establishmentId)
            ->where('school_year_id', $academicYear->id)
            ->whereIn('student_id', $students->pluck('id'))
            ->delete();

        foreach ($students as $student) {
            $email = $student->user?->email;
            $schoolClass = $student->schoolClass;

            if (! is_string($email) || ! isset(self::STUDENT_ATTENDANCE_PLAN[$email]) || ! $schoolClass) {
                continue;
            }

            $plan = self::STUDENT_ATTENDANCE_PLAN[$email];

            $this->refreshAttendanceDemoData(
                studentUserId: (int) $student->user_id,
                schoolClass: $schoolClass,
                teacherId: (int) $teacher->id,
                establishmentId: $establishmentId,
                schoolYearId: (int) $academicYear->id,
                absences: $plan['absences'],
                lates: $plan['lates'],
            );
        }

        app(StudentRiskAnalyzer::class)->analyzeStudents($establishmentId, (int) $academicYear->id);
    }

    private function refreshAttendanceDemoData(
        int $studentUserId,
        SchoolClass $schoolClass,
        int $teacherId,
        int $establishmentId,
        int $schoolYearId,
        int $absences,
        int $lates,
    ): void {
        Attendance::query()
            ->where('student_id', $studentUserId)
            ->where('teacher_id', $teacherId)
            ->whereHas('schedule', function ($query) use ($establishmentId, $schoolYearId): void {
                $query
                    ->where('establishment_id', $establishmentId)
                    ->whereHas('schoolClass', function ($classQuery) use ($establishmentId, $schoolYearId): void {
                        $classQuery
                            ->where('establishment_id', $establishmentId)
                            ->where('academic_year_id', $schoolYearId);
                    });
            })
            ->delete();

        $this->seedAttendanceBatch(
            studentUserId: $studentUserId,
            schoolClass: $schoolClass,
            teacherId: $teacherId,
            establishmentId: $establishmentId,
            status: Attendance::STATUS_ABSENT,
            total: $absences,
            slotOffset: 0,
        );

        $this->seedAttendanceBatch(
            studentUserId: $studentUserId,
            schoolClass: $schoolClass,
            teacherId: $teacherId,
            establishmentId: $establishmentId,
            status: Attendance::STATUS_LATE,
            total: $lates,
            slotOffset: 100,
        );
    }

    private function seedAttendanceBatch(
        int $studentUserId,
        SchoolClass $schoolClass,
        int $teacherId,
        int $establishmentId,
        string $status,
        int $total,
        int $slotOffset,
    ): void {
        if ($total <= 0) {
            return;
        }

        $subjects = Subject::query()
            ->where('establishment_id', $establishmentId)
            ->orderBy('id')
            ->get();

        if ($subjects->isEmpty()) {
            return;
        }

        $timeSlots = [
            ['day' => 'Monday', 'start' => '08:00:00', 'end' => '09:00:00'],
            ['day' => 'Monday', 'start' => '09:00:00', 'end' => '10:00:00'],
            ['day' => 'Tuesday', 'start' => '08:00:00', 'end' => '09:00:00'],
            ['day' => 'Tuesday', 'start' => '09:00:00', 'end' => '10:00:00'],
            ['day' => 'Wednesday', 'start' => '08:00:00', 'end' => '09:00:00'],
            ['day' => 'Wednesday', 'start' => '09:00:00', 'end' => '10:00:00'],
            ['day' => 'Thursday', 'start' => '08:00:00', 'end' => '09:00:00'],
            ['day' => 'Thursday', 'start' => '09:00:00', 'end' => '10:00:00'],
            ['day' => 'Friday', 'start' => '08:00:00', 'end' => '09:00:00'],
            ['day' => 'Friday', 'start' => '09:00:00', 'end' => '10:00:00'],
            ['day' => 'Saturday', 'start' => '08:00:00', 'end' => '09:00:00'],
            ['day' => 'Saturday', 'start' => '09:00:00', 'end' => '10:00:00'],
        ];

        for ($index = 0; $index < $total; $index++) {
            $absoluteIndex = $index + $slotOffset;
            $slot = $timeSlots[$absoluteIndex % count($timeSlots)];
            $subject = $subjects[$absoluteIndex % $subjects->count()];
            $schedule = Schedule::query()->updateOrCreate(
                [
                    'establishment_id' => $establishmentId,
                    'class_id' => $schoolClass->id,
                    'subject_id' => $subject->id,
                    'teacher_id' => $teacherId,
                    'day_of_week' => $slot['day'],
                    'start_time' => $slot['start'],
                    'end_time' => $slot['end'],
                ],
                [
                    'created_by' => $teacherId,
                ],
            );

            Attendance::query()->create([
                'establishment_id' => $establishmentId,
                'schedule_id' => $schedule->id,
                'student_id' => $studentUserId,
                'teacher_id' => $teacherId,
                'status' => $status,
                'recorded_at' => now()->subDays($index + 1),
            ]);
        }
    }
}
