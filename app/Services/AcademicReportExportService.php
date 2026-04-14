<?php

namespace App\Services;

use App\Models\AcademicYear;
use App\Models\SchoolClass;
use App\Models\StudentProfile;
use App\Models\Subject;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class AcademicReportExportService
{
    private const PASSING_GRADE = 10.0;

    /**
     * @return array{start_date: string, end_date: string}
     */
    public function defaultRangeFor(User $user): array
    {
        $academicYear = AcademicYear::query()
            ->where('establishment_id', $user->establishment_id)
            ->orderByDesc('is_current')
            ->orderByDesc('start_date')
            ->first();

        if ($academicYear !== null) {
            return [
                'start_date' => $academicYear->start_date?->toDateString() ?? now()->subDays(30)->toDateString(),
                'end_date' => $academicYear->end_date?->toDateString() ?? now()->toDateString(),
            ];
        }

        return [
            'start_date' => now()->subDays(30)->toDateString(),
            'end_date' => now()->toDateString(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function buildFor(User $user, CarbonImmutable $startDate, CarbonImmutable $endDate): array
    {
        $establishmentId = (int) $user->establishment_id;

        $classAverages = $this->classAverages($establishmentId, $startDate, $endDate);
        $subjectAverages = $this->subjectAverages($establishmentId, $startDate, $endDate);
        $teacherPerformance = $this->teacherPerformance($establishmentId, $startDate, $endDate);
        $globalMetrics = $this->globalMetrics($establishmentId, $startDate, $endDate);

        $reportRowsCount = (int) ($globalMetrics?->grade_count ?? 0);
        $successRate = round((float) ($globalMetrics?->success_rate ?? 0), 1);
        $globalAverage = round((float) ($globalMetrics?->average_grade ?? 0), 2);

        return [
            'meta' => [
                'establishmentName' => $user->establishment?->name ?? 'Etablissement',
                'generatedAt' => now()->format('Y-m-d H:i'),
                'period' => [
                    'startDate' => $startDate->toDateString(),
                    'endDate' => $endDate->toDateString(),
                    'label' => sprintf(
                        '%s au %s',
                        $startDate->format('d/m/Y'),
                        $endDate->format('d/m/Y'),
                    ),
                ],
                'hasAcademicData' => $reportRowsCount > 0,
            ],
            'stats' => [
                'totalClasses' => SchoolClass::query()
                    ->where('establishment_id', $establishmentId)
                    ->count(),
                'totalStudents' => $this->studentCountFor($establishmentId),
                'totalSubjects' => Subject::query()
                    ->where('establishment_id', $establishmentId)
                    ->count(),
                'totalTeachers' => $teacherPerformance->count(),
                'globalAverage' => $globalAverage,
                'successRate' => $successRate,
                'gradesCount' => $reportRowsCount,
                'passingThreshold' => self::PASSING_GRADE,
            ],
            'classAverages' => $classAverages->values()->all(),
            'subjectAverages' => $subjectAverages->values()->all(),
            'teacherPerformance' => $teacherPerformance->values()->all(),
        ];
    }

    public function fileName(CarbonImmutable $startDate, CarbonImmutable $endDate, string $extension): string
    {
        return sprintf(
            'academic-report-%s-to-%s.%s',
            $startDate->format('Ymd'),
            $endDate->format('Ymd'),
            $extension,
        );
    }

    private function studentCountFor(int $establishmentId): int
    {
        $profileQuery = StudentProfile::query()
            ->where('establishment_id', $establishmentId);

        if (Schema::hasColumn('student_profiles', 'deleted_at')) {
            $profileQuery->whereNull('deleted_at');
        }

        $profileCount = (clone $profileQuery)->distinct('user_id')->count('user_id');

        if ($profileCount > 0) {
            return $profileCount;
        }

        return User::query()
            ->where('establishment_id', $establishmentId)
            ->whereHas('roles', fn ($query) => $query->where('name', 'student'))
            ->count();
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    private function classAverages(
        int $establishmentId,
        CarbonImmutable $startDate,
        CarbonImmutable $endDate,
    ): Collection {
        return DB::table('classes')
            ->leftJoin('evaluations', function ($join) use ($establishmentId, $startDate, $endDate) {
                $join->on('evaluations.class_id', '=', 'classes.id')
                    ->where('evaluations.establishment_id', '=', $establishmentId)
                    ->whereNull('evaluations.deleted_at')
                    ->whereBetween('evaluations.evaluation_date', [
                        $startDate->toDateString(),
                        $endDate->toDateString(),
                    ]);
            })
            ->leftJoin('grades', 'grades.evaluation_id', '=', 'evaluations.id')
            ->where('classes.establishment_id', $establishmentId)
            ->groupBy('classes.id', 'classes.name')
            ->orderBy('classes.name')
            ->selectRaw('classes.id, classes.name as class_name')
            ->selectRaw('coalesce(round(avg(grades.grade), 2), 0) as average_grade')
            ->selectRaw('count(grades.id) as grade_count')
            ->get()
            ->map(fn (object $row) => [
                'id' => (int) $row->id,
                'className' => $row->class_name,
                'average' => round((float) $row->average_grade, 2),
                'gradesCount' => (int) $row->grade_count,
            ]);
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    private function subjectAverages(
        int $establishmentId,
        CarbonImmutable $startDate,
        CarbonImmutable $endDate,
    ): Collection {
        return DB::table('subjects')
            ->leftJoin('evaluations', function ($join) use ($establishmentId, $startDate, $endDate) {
                $join->on('evaluations.subject_id', '=', 'subjects.id')
                    ->where('evaluations.establishment_id', '=', $establishmentId)
                    ->whereNull('evaluations.deleted_at')
                    ->whereBetween('evaluations.evaluation_date', [
                        $startDate->toDateString(),
                        $endDate->toDateString(),
                    ]);
            })
            ->leftJoin('grades', 'grades.evaluation_id', '=', 'evaluations.id')
            ->where('subjects.establishment_id', $establishmentId)
            ->groupBy('subjects.id', 'subjects.name')
            ->orderBy('subjects.name')
            ->selectRaw('subjects.id, subjects.name')
            ->selectRaw('coalesce(round(avg(grades.grade), 2), 0) as average_grade')
            ->selectRaw('count(grades.id) as grade_count')
            ->get()
            ->map(fn (object $row) => [
                'id' => (int) $row->id,
                'name' => $row->name,
                'average' => round((float) $row->average_grade, 2),
                'gradesCount' => (int) $row->grade_count,
            ]);
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    private function teacherPerformance(
        int $establishmentId,
        CarbonImmutable $startDate,
        CarbonImmutable $endDate,
    ): Collection {
        $assignmentRows = DB::table('class_subjects')
            ->join('users', 'users.id', '=', 'class_subjects.teacher_id')
            ->join('classes', 'classes.id', '=', 'class_subjects.class_id')
            ->join('subjects', 'subjects.id', '=', 'class_subjects.subject_id')
            ->where('users.establishment_id', $establishmentId)
            ->where('classes.establishment_id', $establishmentId)
            ->where('subjects.establishment_id', $establishmentId)
            ->groupBy('users.id', 'users.name')
            ->orderBy('users.name')
            ->selectRaw('users.id, users.name')
            ->selectRaw('count(distinct class_subjects.class_id) as classes_count')
            ->selectRaw('count(distinct class_subjects.subject_id) as subjects_count')
            ->get()
            ->keyBy('id');

        $metricRows = DB::table('class_subjects')
            ->join('users', 'users.id', '=', 'class_subjects.teacher_id')
            ->leftJoin('evaluations', function ($join) use ($establishmentId, $startDate, $endDate) {
                $join->on('evaluations.class_id', '=', 'class_subjects.class_id')
                    ->on('evaluations.subject_id', '=', 'class_subjects.subject_id')
                    ->where('evaluations.establishment_id', '=', $establishmentId)
                    ->whereNull('evaluations.deleted_at')
                    ->whereBetween('evaluations.evaluation_date', [
                        $startDate->toDateString(),
                        $endDate->toDateString(),
                    ]);
            })
            ->leftJoin('grades', 'grades.evaluation_id', '=', 'evaluations.id')
            ->where('users.establishment_id', $establishmentId)
            ->groupBy('users.id')
            ->selectRaw('users.id as teacher_id')
            ->selectRaw('coalesce(round(avg(grades.grade), 2), 0) as average_grade')
            ->selectRaw('count(grades.id) as grade_count')
            ->selectRaw(
                'coalesce(round(100.0 * avg(case when grades.grade >= ? then 1 else 0 end), 1), 0) as success_rate',
                [self::PASSING_GRADE],
            )
            ->get()
            ->keyBy('teacher_id');

        return $assignmentRows->map(function (object $assignment) use ($metricRows) {
            $metrics = $metricRows->get($assignment->id);

            return [
                'id' => (int) $assignment->id,
                'name' => $assignment->name,
                'classesCount' => (int) $assignment->classes_count,
                'subjectsCount' => (int) $assignment->subjects_count,
                'average' => round((float) ($metrics->average_grade ?? 0), 2),
                'successRate' => round((float) ($metrics->success_rate ?? 0), 1),
                'gradesCount' => (int) ($metrics->grade_count ?? 0),
            ];
        })->values();
    }

    private function globalMetrics(
        int $establishmentId,
        CarbonImmutable $startDate,
        CarbonImmutable $endDate,
    ): ?object {
        return DB::table('grades')
            ->join('evaluations', 'evaluations.id', '=', 'grades.evaluation_id')
            ->where('evaluations.establishment_id', $establishmentId)
            ->whereNull('evaluations.deleted_at')
            ->whereBetween('evaluations.evaluation_date', [
                $startDate->toDateString(),
                $endDate->toDateString(),
            ])
            ->selectRaw('coalesce(round(avg(grades.grade), 2), 0) as average_grade')
            ->selectRaw('count(grades.id) as grade_count')
            ->selectRaw(
                'coalesce(round(100.0 * avg(case when grades.grade >= ? then 1 else 0 end), 1), 0) as success_rate',
                [self::PASSING_GRADE],
            )
            ->first();
    }
}
