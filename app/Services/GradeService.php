<?php

namespace App\Services;

use App\Models\Evaluation;
use App\Models\Grade;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class GradeService
{
    public function calculateStudentAverage(
        int $studentId,
        int $subjectId,
        int $termId,
    ): ?float {
        $row = Grade::query()
            ->join('evaluations', 'evaluations.id', '=', 'grades.evaluation_id')
            ->where('grades.student_id', $studentId)
            ->where('evaluations.subject_id', $subjectId)
            ->where('evaluations.term_id', $termId)
            ->whereNull('evaluations.deleted_at')
            ->when(
                Schema::hasColumn('grades', 'deleted_at'),
                fn ($query) => $query->whereNull('grades.deleted_at'),
            )
            ->selectRaw('sum(grades.grade * evaluations.coefficient) as weighted_sum')
            ->selectRaw('sum(evaluations.coefficient) as coefficient_sum')
            ->first();

        $coefficientSum = (float) ($row?->coefficient_sum ?? 0);

        if ($coefficientSum <= 0) {
            return null;
        }

        return round(((float) $row->weighted_sum) / $coefficientSum, 2);
    }

    public function calculateGeneralAverage(int $studentId, int $termId): ?float
    {
        $row = Grade::query()
            ->join('evaluations', 'evaluations.id', '=', 'grades.evaluation_id')
            ->where('grades.student_id', $studentId)
            ->where('evaluations.term_id', $termId)
            ->whereNull('evaluations.deleted_at')
            ->when(
                Schema::hasColumn('grades', 'deleted_at'),
                fn ($query) => $query->whereNull('grades.deleted_at'),
            )
            ->selectRaw('sum(grades.grade * evaluations.coefficient) as weighted_sum')
            ->selectRaw('sum(evaluations.coefficient) as coefficient_sum')
            ->first();

        $coefficientSum = (float) ($row?->coefficient_sum ?? 0);

        if ($coefficientSum <= 0) {
            return null;
        }

        return round(((float) $row->weighted_sum) / $coefficientSum, 2);
    }

    public function upsertEvaluationGrades(Evaluation $evaluation, array $rows, ?int $actorId = null): void
    {
        $gradeColumns = array_flip(Schema::getColumnListing('grades'));

        foreach ($rows as $row) {
            $gradeValue = $row['grade'] ?? null;
            $studentId = (int) $row['student_id'];

            if ($gradeValue === null || $gradeValue === '') {
                Grade::query()
                    ->where('evaluation_id', $evaluation->id)
                    ->where('student_id', $studentId)
                    ->delete();

                continue;
            }

            $payload = [
                'grade' => $gradeValue,
                'remarks' => $row['remarks'] ?? null,
            ];

            if (isset($gradeColumns['establishment_id'])) {
                $payload['establishment_id'] = $evaluation->establishment_id;
            }

            if (isset($gradeColumns['academic_year_id'])) {
                $payload['academic_year_id'] = $evaluation->schoolClass?->academic_year_id;
            }

            if (isset($gradeColumns['term_id'])) {
                $payload['term_id'] = $evaluation->term_id;
            }

            if ($actorId !== null && isset($gradeColumns['created_by'])) {
                $payload['created_by'] = $actorId;
            }

            if ($actorId !== null && isset($gradeColumns['updated_by'])) {
                $payload['updated_by'] = $actorId;
            }

            Grade::query()->updateOrCreate(
                [
                    'evaluation_id' => $evaluation->id,
                    'student_id' => $studentId,
                ],
                $payload,
            );
        }
    }
}
