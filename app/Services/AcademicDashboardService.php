<?php

namespace App\Services;

use App\Models\SchoolClass;
use App\Models\StudentProfile;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class AcademicDashboardService
{
    private const PASSING_GRADE = 10.0;

    /**
     * @return array<string, mixed>
     */
    public function buildFor(User $user): array
    {
        $establishmentId = (int) $user->establishment_id;

        $totalClasses = SchoolClass::query()
            ->where('establishment_id', $establishmentId)
            ->count();

        $totalStudents = $this->studentCountFor($establishmentId);
        $averagesByClass = $this->averagesByClass($establishmentId);
        $studentAverages = $this->studentAverages($establishmentId);

        $gradedClasses = $averagesByClass->where('grade_count', '>', 0)->count();
        $successCount = $studentAverages
            ->filter(fn (object $row) => (float) $row->average_grade >= self::PASSING_GRADE)
            ->count();
        $studentsWithGrades = $studentAverages->count();
        $successRate = $studentsWithGrades > 0
            ? round(($successCount / $studentsWithGrades) * 100, 1)
            : 0.0;

        $formattedAverages = $averagesByClass
            ->map(fn (object $row) => [
                'className' => $row->class_name,
                'average' => round((float) ($row->average_grade ?? 0), 2),
                'gradeCount' => (int) $row->grade_count,
            ])
            ->values();

        return [
            'stats' => [
                'totalClasses' => $totalClasses,
                'totalStudents' => $totalStudents,
                'successRate' => $successRate,
                'studentsWithGrades' => $studentsWithGrades,
                'gradedClasses' => $gradedClasses,
                'passingThreshold' => self::PASSING_GRADE,
                'hasAcademicData' => $studentsWithGrades > 0,
            ],
            'averagesByClass' => $formattedAverages,
            'charts' => [
                'classAverages' => [
                    'labels' => $formattedAverages->pluck('className')->all(),
                    'values' => $formattedAverages->pluck('average')->all(),
                ],
                'successBreakdown' => [
                    'labels' => ['Reussite', 'A renforcer'],
                    'values' => [
                        $successCount,
                        max($studentsWithGrades - $successCount, 0),
                    ],
                ],
            ],
        ];
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
     * @return Collection<int, object>
     */
    private function averagesByClass(int $establishmentId): Collection
    {
        return DB::table('classes')
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
            ->get();
    }

    /**
     * @return Collection<int, object>
     */
    private function studentAverages(int $establishmentId): Collection
    {
        return DB::table('grades')
            ->join('evaluations', 'evaluations.id', '=', 'grades.evaluation_id')
            ->where('evaluations.establishment_id', $establishmentId)
            ->whereNull('evaluations.deleted_at')
            ->groupBy('grades.student_id')
            ->selectRaw('grades.student_id')
            ->selectRaw('round(avg(grades.grade), 2) as average_grade')
            ->get();
    }
}
