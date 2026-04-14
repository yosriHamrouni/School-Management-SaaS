<?php

namespace App\Services;

use App\Models\Subject;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class DetailedPerformanceAnalysisService
{
    private const PASSING_GRADE = 10.0;

    /**
     * @return array<string, mixed>
     */
    public function buildFor(User $user): array
    {
        $establishmentId = (int) $user->establishment_id;

        $subjectPerformance = $this->subjectPerformance($establishmentId);
        $classComparison = $this->classComparison($establishmentId);
        $teacherPerformance = $this->teacherPerformance($establishmentId);
        $globalMetrics = $this->globalMetrics($establishmentId);

        return [
            'stats' => [
                'totalSubjects' => Subject::query()
                    ->where('establishment_id', $establishmentId)
                    ->count(),
                'totalTeachers' => $teacherPerformance->count(),
                'globalAverage' => round((float) ($globalMetrics->average_grade ?? 0), 2),
                'successRate' => round((float) ($globalMetrics->success_rate ?? 0), 1),
                'passingThreshold' => self::PASSING_GRADE,
                'hasAcademicData' => ((int) ($globalMetrics->grade_count ?? 0)) > 0,
            ],
            'subjectPerformance' => $subjectPerformance->values()->all(),
            'classComparison' => $classComparison->values()->all(),
            'teacherPerformance' => $teacherPerformance->values()->all(),
            'charts' => [
                'subjectsAverageChart' => [
                    'labels' => $subjectPerformance->pluck('name')->all(),
                    'values' => $subjectPerformance->pluck('average')->all(),
                ],
                'classesComparisonChart' => [
                    'labels' => $classComparison->pluck('className')->all(),
                    'values' => $classComparison->pluck('average')->all(),
                    'series' => $this->classComparisonSeries($classComparison),
                ],
            ],
        ];
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    private function subjectPerformance(int $establishmentId): Collection
    {
        $rows = DB::table('subjects')
            ->leftJoin('evaluations', function ($join) use ($establishmentId) {
                $join->on('evaluations.subject_id', '=', 'subjects.id')
                    ->where('evaluations.establishment_id', '=', $establishmentId)
                    ->whereNull('evaluations.deleted_at');
            })
            ->leftJoin('grades', 'grades.evaluation_id', '=', 'evaluations.id')
            ->where('subjects.establishment_id', $establishmentId)
            ->groupBy('subjects.id', 'subjects.name')
            ->orderBy('subjects.name')
            ->selectRaw('subjects.id, subjects.name')
            ->selectRaw('coalesce(round(avg(grades.grade), 2), 0) as average_grade')
            ->selectRaw('count(grades.id) as grade_count')
            ->get();

        return $rows->map(fn (object $row) => [
            'id' => (int) $row->id,
            'name' => $row->name,
            'average' => round((float) $row->average_grade, 2),
            'gradesCount' => (int) $row->grade_count,
        ]);
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    private function classComparison(int $establishmentId): Collection
    {
        $classRows = DB::table('classes')
            ->leftJoin('evaluations', function ($join) use ($establishmentId) {
                $join->on('evaluations.class_id', '=', 'classes.id')
                    ->where('evaluations.establishment_id', '=', $establishmentId)
                    ->whereNull('evaluations.deleted_at');
            })
            ->leftJoin('grades', 'grades.evaluation_id', '=', 'evaluations.id')
            ->where('classes.establishment_id', $establishmentId)
            ->groupBy('classes.id', 'classes.name')
            ->orderBy('classes.name')
            ->selectRaw('classes.id, classes.name as class_name')
            ->selectRaw('coalesce(round(avg(grades.grade), 2), 0) as average_grade')
            ->selectRaw('count(grades.id) as grade_count')
            ->get()
            ->keyBy('id');

        $breakdownRows = DB::table('classes')
            ->join('evaluations', function ($join) use ($establishmentId) {
                $join->on('evaluations.class_id', '=', 'classes.id')
                    ->where('evaluations.establishment_id', '=', $establishmentId)
                    ->whereNull('evaluations.deleted_at');
            })
            ->join('subjects', 'subjects.id', '=', 'evaluations.subject_id')
            ->join('grades', 'grades.evaluation_id', '=', 'evaluations.id')
            ->where('classes.establishment_id', $establishmentId)
            ->groupBy('classes.id', 'classes.name', 'subjects.id', 'subjects.name')
            ->orderBy('classes.name')
            ->orderBy('subjects.name')
            ->selectRaw('classes.id as class_id, classes.name as class_name')
            ->selectRaw('subjects.id as subject_id, subjects.name as subject_name')
            ->selectRaw('round(avg(grades.grade), 2) as average_grade')
            ->selectRaw('count(grades.id) as grade_count')
            ->get()
            ->groupBy('class_id');

        return $classRows->map(function (object $row) use ($breakdownRows) {
            $subjectBreakdown = ($breakdownRows->get($row->id) ?? collect())
                ->map(fn (object $breakdown) => [
                    'subjectId' => (int) $breakdown->subject_id,
                    'subjectName' => $breakdown->subject_name,
                    'average' => round((float) $breakdown->average_grade, 2),
                    'gradesCount' => (int) $breakdown->grade_count,
                ])
                ->values()
                ->all();

            return [
                'className' => $row->class_name,
                'average' => round((float) $row->average_grade, 2),
                'gradesCount' => (int) $row->grade_count,
                'subjectBreakdown' => $subjectBreakdown,
            ];
        })->values();
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    private function teacherPerformance(int $establishmentId): Collection
    {
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
            ->leftJoin('evaluations', function ($join) use ($establishmentId) {
                $join->on('evaluations.class_id', '=', 'class_subjects.class_id')
                    ->on('evaluations.subject_id', '=', 'class_subjects.subject_id')
                    ->where('evaluations.establishment_id', '=', $establishmentId)
                    ->whereNull('evaluations.deleted_at');
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

    private function globalMetrics(int $establishmentId): object
    {
        return DB::table('grades')
            ->join('evaluations', 'evaluations.id', '=', 'grades.evaluation_id')
            ->where('evaluations.establishment_id', $establishmentId)
            ->whereNull('evaluations.deleted_at')
            ->selectRaw('coalesce(round(avg(grades.grade), 2), 0) as average_grade')
            ->selectRaw('count(grades.id) as grade_count')
            ->selectRaw(
                'coalesce(round(100.0 * avg(case when grades.grade >= ? then 1 else 0 end), 1), 0) as success_rate',
                [self::PASSING_GRADE],
            )
            ->first();
    }

    /**
     * @param  Collection<int, array<string, mixed>>  $classComparison
     * @return array<int, array<string, mixed>>
     */
    private function classComparisonSeries(Collection $classComparison): array
    {
        $subjects = $classComparison
            ->flatMap(fn (array $classRow) => $classRow['subjectBreakdown'])
            ->pluck('subjectName')
            ->unique()
            ->values();

        return $subjects->map(function (string $subjectName) use ($classComparison) {
            return [
                'name' => $subjectName,
                'values' => $classComparison->map(function (array $classRow) use ($subjectName) {
                    $subjectRow = collect($classRow['subjectBreakdown'])
                        ->firstWhere('subjectName', $subjectName);

                    return round((float) ($subjectRow['average'] ?? 0), 2);
                })->all(),
            ];
        })->all();
    }
}
