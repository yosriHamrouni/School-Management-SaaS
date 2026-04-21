<?php

namespace App\Services\Risk;

use App\Models\AcademicYear;
use App\Models\Attendance;
use App\Models\Grade;
use App\Models\StudentProfile;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Schema;

class StudentRiskDataService
{
    /**
     * @return array<string, mixed>|null
     */
    public function getStudentRawData(int $studentId, int $establishmentId, int $schoolYearId): ?array
    {
        return $this->getStudentsRawData($establishmentId, $schoolYearId, [$studentId])->first();
    }

    /**
     * @param  array<int, int>|null  $studentIds
     * @return Collection<int, array<string, mixed>>
     */
    public function getStudentsRawData(int $establishmentId, int $schoolYearId, ?array $studentIds = null): Collection
    {
        $academicYear = $this->resolveActiveAcademicYear($establishmentId, $schoolYearId);

        if ($academicYear === null) {
            return collect();
        }

        $students = $this->studentQuery($establishmentId, $academicYear->id, $studentIds)->get();

        if ($students->isEmpty()) {
            return collect();
        }

        $studentUserIds = $students
            ->pluck('user_id')
            ->filter(static fn (mixed $userId): bool => $userId !== null)
            ->map(static fn (mixed $userId): int => (int) $userId)
            ->unique()
            ->values()
            ->all();

        $gradesByStudent = $this->loadGradesByStudent($studentUserIds, $establishmentId, $academicYear->id);
        $attendanceCountsByStudent = $this->loadAttendanceCountsByStudent($studentUserIds, $establishmentId, $academicYear->id);

        return $students
            ->map(function (StudentProfile $student) use ($academicYear, $gradesByStudent, $attendanceCountsByStudent): array {
                $userId = $student->user_id !== null ? (int) $student->user_id : null;
                $attendanceCounts = $userId !== null
                    ? ($attendanceCountsByStudent[$userId] ?? ['absences_count' => 0, 'lates_count' => 0])
                    : ['absences_count' => 0, 'lates_count' => 0];

                return [
                    'student_id' => (int) $student->id,
                    'establishment_id' => (int) $student->establishment_id,
                    'school_year_id' => (int) $academicYear->id,
                    'grades' => $userId !== null ? ($gradesByStudent[$userId] ?? []) : [],
                    'absences_count' => (int) $attendanceCounts['absences_count'],
                    'lates_count' => (int) $attendanceCounts['lates_count'],
                ];
            })
            ->values();
    }

    /**
     * Backward-compatible alias for the existing controller.
     *
     * @return Collection<int, array<string, mixed>>
     */
    public function getStudentsDataForRiskAnalysis(int $establishmentId, int $schoolYearId): Collection
    {
        return $this->getStudentsRawData($establishmentId, $schoolYearId);
    }

    private function resolveActiveAcademicYear(int $establishmentId, int $schoolYearId): ?AcademicYear
    {
        return AcademicYear::query()
            ->select(['id', 'establishment_id', 'status', 'is_current'])
            ->whereKey($schoolYearId)
            ->where('establishment_id', $establishmentId)
            ->where('status', 'active')
            ->where('is_current', true)
            ->first();
    }

    /**
     * @param  array<int, int>|null  $studentIds
     */
    private function studentQuery(int $establishmentId, int $schoolYearId, ?array $studentIds): Builder
    {
        $studentIds = $studentIds !== null
            ? array_values(array_unique(array_map('intval', $studentIds)))
            : null;

        return StudentProfile::query()
            ->select(['id', 'user_id', 'establishment_id', 'class_id'])
            ->with([
                'user:id,establishment_id',
                'schoolClass:id,establishment_id,academic_year_id',
            ])
            ->where('establishment_id', $establishmentId)
            ->whereHas('user', function (Builder $query) use ($establishmentId): void {
                $query->where('establishment_id', $establishmentId);
            })
            ->whereHas('schoolClass', function (Builder $query) use ($establishmentId, $schoolYearId): void {
                $query
                    ->where('establishment_id', $establishmentId)
                    ->where('academic_year_id', $schoolYearId);
            })
            ->when(
                $studentIds !== null,
                fn (Builder $query): Builder => $query->whereIn('id', $studentIds),
            );
    }

    /**
     * @param  array<int, int>  $studentUserIds
     * @return array<int, array<int, array<string, mixed>>>
     */
    private function loadGradesByStudent(array $studentUserIds, int $establishmentId, int $schoolYearId): array
    {
        if ($studentUserIds === []) {
            return [];
        }

        $grades = Grade::query()
            ->select(['id', 'evaluation_id', 'student_id', 'grade', 'created_at'])
            ->when(
                Schema::hasColumn('grades', 'establishment_id'),
                fn (Builder $query): Builder => $query->where('establishment_id', $establishmentId),
            )
            ->when(
                Schema::hasColumn('grades', 'academic_year_id'),
                fn (Builder $query): Builder => $query->where('academic_year_id', $schoolYearId),
            )
            ->whereIn('student_id', $studentUserIds)
            ->whereHas('evaluation', function (Builder $query) use ($establishmentId, $schoolYearId): void {
                $query
                    ->where('establishment_id', $establishmentId)
                    ->whereHas('schoolClass', function (Builder $classQuery) use ($establishmentId, $schoolYearId): void {
                        $classQuery
                            ->where('establishment_id', $establishmentId)
                            ->where('academic_year_id', $schoolYearId);
                    });
            })
            ->with([
                'evaluation:id,class_id,subject_id,evaluation_date',
                'evaluation.subject:id,name',
            ])
            ->get()
            ->sortBy(function (Grade $grade): string {
                $evaluationTimestamp = $grade->evaluation?->evaluation_date?->getTimestamp() ?? 0;
                $createdAtTimestamp = $grade->created_at?->getTimestamp() ?? 0;

                return sprintf('%012d-%012d-%012d', $evaluationTimestamp, $createdAtTimestamp, (int) $grade->id);
            });

        $grouped = [];

        foreach ($grades as $grade) {
            $studentId = (int) $grade->student_id;

            $grouped[$studentId][] = [
                'subject_id' => $grade->evaluation?->subject_id !== null ? (int) $grade->evaluation->subject_id : null,
                'subject_name' => $grade->evaluation?->subject?->name,
                'value' => $grade->grade !== null ? round((float) $grade->grade, 2) : 0.0,
                'recorded_at' => $grade->evaluation?->evaluation_date?->toDateString()
                    ?? $grade->created_at?->toDateString(),
            ];
        }

        return $grouped;
    }

    /**
     * @param  array<int, int>  $studentUserIds
     * @return array<int, array{absences_count: int, lates_count: int}>
     */
    private function loadAttendanceCountsByStudent(array $studentUserIds, int $establishmentId, int $schoolYearId): array
    {
        if ($studentUserIds === []) {
            return [];
        }

        $rows = Attendance::query()
            ->selectRaw('student_id, status, COUNT(*) as total')
            ->forEstablishment($establishmentId)
            ->whereIn('student_id', $studentUserIds)
            ->whereIn('status', [Attendance::STATUS_ABSENT, Attendance::STATUS_LATE])
            ->whereHas('schedule', function (Builder $query) use ($establishmentId, $schoolYearId): void {
                $query
                    ->where('establishment_id', $establishmentId)
                    ->whereHas('schoolClass', function (Builder $classQuery) use ($establishmentId, $schoolYearId): void {
                        $classQuery
                            ->where('establishment_id', $establishmentId)
                            ->where('academic_year_id', $schoolYearId);
                    });
            })
            ->groupBy('student_id', 'status')
            ->get();

        $counts = [];

        foreach ($rows as $row) {
            $studentId = (int) $row->student_id;
            $counts[$studentId] ??= [
                'absences_count' => 0,
                'lates_count' => 0,
            ];

            if ($row->status === Attendance::STATUS_ABSENT) {
                $counts[$studentId]['absences_count'] = (int) $row->total;
            }

            if ($row->status === Attendance::STATUS_LATE) {
                $counts[$studentId]['lates_count'] = (int) $row->total;
            }
        }

        return $counts;
    }
}
