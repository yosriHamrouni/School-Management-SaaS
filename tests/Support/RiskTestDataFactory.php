<?php

namespace Tests\Support;

use App\Models\AcademicYear;
use App\Models\Attendance;
use App\Models\Establishment;
use App\Models\Evaluation;
use App\Models\Level;
use App\Models\Schedule;
use App\Models\SchoolClass;
use App\Models\StudentProfile;
use App\Models\Subject;
use App\Models\Term;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class RiskTestDataFactory
{
    public static function createEstablishment(string $name, string $code): Establishment
    {
        return Establishment::create([
            'name' => $name,
            'code' => $code,
            'type' => 'School',
            'email' => strtolower($code).'@school.test',
        ]);
    }

    public static function createAcademicYear(
        Establishment $establishment,
        string $name,
        bool $isCurrent,
        string $status = 'active',
    ): AcademicYear {
        return AcademicYear::create([
            'establishment_id' => $establishment->id,
            'name' => $name,
            'start_date' => $isCurrent ? '2025-09-01' : '2024-09-01',
            'end_date' => $isCurrent ? '2026-06-30' : '2025-06-30',
            'status' => $status,
            'is_current' => $isCurrent,
        ]);
    }

    public static function createClass(
        Establishment $establishment,
        AcademicYear $academicYear,
        string $name,
    ): SchoolClass {
        $level = Level::create([
            'establishment_id' => $establishment->id,
            'name' => 'Level '.$name,
        ]);

        return SchoolClass::create([
            'establishment_id' => $establishment->id,
            'level_id' => $level->id,
            'academic_year_id' => $academicYear->id,
            'name' => $name,
        ]);
    }

    /**
     * @return array{user: User, profile: StudentProfile}
     */
    public static function createStudent(
        Establishment $establishment,
        SchoolClass $class,
        string $studentNumber,
        string $name,
        string $email,
    ): array {
        $user = User::factory()->create([
            'establishment_id' => $establishment->id,
            'name' => $name,
            'email' => $email,
        ]);

        $profile = StudentProfile::create([
            'user_id' => $user->id,
            'establishment_id' => $establishment->id,
            'class_id' => $class->id,
            'student_number' => $studentNumber,
        ]);

        DB::table('class_students')->insert([
            'class_id' => $class->id,
            'student_id' => $user->id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return [
            'user' => $user,
            'profile' => $profile,
        ];
    }

    public static function createSubject(Establishment $establishment, string $name): Subject
    {
        return Subject::create([
            'establishment_id' => $establishment->id,
            'name' => $name,
        ]);
    }

    public static function createTerm(
        Establishment $establishment,
        AcademicYear $academicYear,
        string $name,
    ): Term {
        return Term::create([
            'establishment_id' => $establishment->id,
            'academic_year_id' => $academicYear->id,
            'name' => $name,
        ]);
    }

    public static function createEvaluation(
        Establishment $establishment,
        SchoolClass $class,
        Subject $subject,
        Term $term,
        string $title,
        string $date,
    ): Evaluation {
        return Evaluation::create([
            'establishment_id' => $establishment->id,
            'class_id' => $class->id,
            'subject_id' => $subject->id,
            'term_id' => $term->id,
            'title' => $title,
            'evaluation_date' => $date,
            'type' => 'exam',
            'coefficient' => 1,
            'max_grade' => 20,
        ]);
    }

    public static function createSchedule(
        Establishment $establishment,
        SchoolClass $class,
        Subject $subject,
        int $teacherId,
        string $dayOfWeek,
        string $startTime,
        string $endTime,
    ): Schedule {
        return Schedule::create([
            'establishment_id' => $establishment->id,
            'class_id' => $class->id,
            'subject_id' => $subject->id,
            'teacher_id' => $teacherId,
            'day_of_week' => $dayOfWeek,
            'start_time' => $startTime,
            'end_time' => $endTime,
        ]);
    }

    public static function createGrade(int $studentUserId, Evaluation $evaluation, float $score): void
    {
        $payload = [
            'evaluation_id' => $evaluation->id,
            'student_id' => $studentUserId,
            'grade' => $score,
        ];

        if (Schema::hasColumn('grades', 'establishment_id')) {
            $payload['establishment_id'] = $evaluation->establishment_id;
        }

        if (Schema::hasColumn('grades', 'academic_year_id')) {
            $payload['academic_year_id'] = $evaluation->schoolClass?->academic_year_id;
        }

        if (Schema::hasColumn('grades', 'term_id')) {
            $payload['term_id'] = $evaluation->term_id;
        }

        DB::table('grades')->insert(array_merge($payload, [
            'created_at' => now(),
            'updated_at' => now(),
        ]));
    }

    public static function createAttendance(
        Establishment $establishment,
        Schedule $schedule,
        int $studentId,
        int $teacherId,
        string $status,
        string $recordedAt,
    ): Attendance {
        return Attendance::create([
            'establishment_id' => $establishment->id,
            'schedule_id' => $schedule->id,
            'student_id' => $studentId,
            'teacher_id' => $teacherId,
            'status' => $status,
            'recorded_at' => $recordedAt,
        ]);
    }
}
