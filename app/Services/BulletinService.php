<?php

namespace App\Services;

use App\Models\StudentProfile;
use App\Models\Term;
use Illuminate\Support\Facades\DB;

class BulletinService
{
    public function __construct(private readonly GradeService $gradeService)
    {
    }

    public function getStudentReport(int $studentId, int $termId): array
    {
        $studentProfile = StudentProfile::query()
            ->with(['user', 'schoolClass'])
            ->where('user_id', $studentId)
            ->firstOrFail();

        $term = Term::query()->findOrFail($termId);

        $subjects = DB::table('grades')
            ->join('evaluations', 'evaluations.id', '=', 'grades.evaluation_id')
            ->join('subjects', 'subjects.id', '=', 'evaluations.subject_id')
            ->where('grades.student_id', $studentId)
            ->where('evaluations.term_id', $termId)
            ->whereNull('evaluations.deleted_at')
            ->select('subjects.id', 'subjects.name')
            ->distinct()
            ->orderBy('subjects.name')
            ->get();

        $subjectReports = $subjects->map(function ($subject) use ($studentId, $termId) {
            $evaluations = DB::table('grades')
                ->join('evaluations', 'evaluations.id', '=', 'grades.evaluation_id')
                ->where('grades.student_id', $studentId)
                ->where('evaluations.term_id', $termId)
                ->where('evaluations.subject_id', $subject->id)
                ->whereNull('evaluations.deleted_at')
                ->orderBy('evaluations.evaluation_date')
                ->get([
                    'evaluations.id',
                    'evaluations.title',
                    'evaluations.type',
                    'evaluations.evaluation_date',
                    'evaluations.coefficient',
                    'evaluations.max_grade',
                    'grades.grade',
                    'grades.remarks',
                ]);

            return [
                'subject_id' => (int) $subject->id,
                'subject_name' => $subject->name,
                'average' => $this->gradeService->calculateStudentAverage(
                    $studentId,
                    (int) $subject->id,
                    $termId,
                ),
                'evaluations' => $evaluations->map(fn ($evaluation) => [
                    'id' => (int) $evaluation->id,
                    'title' => $evaluation->title,
                    'type' => $evaluation->type,
                    'evaluation_date' => $evaluation->evaluation_date,
                    'coefficient' => (float) $evaluation->coefficient,
                    'max_grade' => (float) $evaluation->max_grade,
                    'grade' => (float) $evaluation->grade,
                    'remarks' => $evaluation->remarks,
                ])->values()->all(),
            ];
        })->values()->all();

        return [
            'student' => [
                'id' => $studentProfile->user_id,
                'name' => $studentProfile->user?->name,
                'student_number' => $studentProfile->student_number,
                'class_name' => $studentProfile->schoolClass?->name,
            ],
            'term' => [
                'id' => $term->id,
                'name' => $term->name,
            ],
            'general_average' => $this->gradeService->calculateGeneralAverage($studentId, $termId),
            'subjects' => $subjectReports,
        ];
    }
}
