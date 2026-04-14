<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreGradeRequest;
use App\Http\Requests\UpdateGradeRequest;
use App\Models\Evaluation;
use App\Models\Grade;
use App\Models\User;
use App\Services\ActivityLogService;
use App\Services\EvaluationAccessService;
use App\Services\GradeService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;

class GradeController extends Controller
{
    public function __construct(
        private readonly EvaluationAccessService $accessService,
        private readonly GradeService $gradeService,
        private readonly ActivityLogService $activityLogService,
    ) {
    }

    public function edit(Request $request, Evaluation $evaluation): Response
    {
        $evaluation = $this->resolveEvaluation($request, $evaluation);
        $students = $this->studentsForEvaluation($evaluation);

        return Inertia::render('Grades/Edit', [
            'evaluation' => [
                'id' => $evaluation->id,
                'title' => $evaluation->title,
                'class_name' => $evaluation->schoolClass?->name,
                'subject_name' => $evaluation->subject?->name,
                'term_id' => $evaluation->term_id,
                'term_name' => $evaluation->term?->name,
                'type' => $evaluation->type,
                'coefficient' => (float) $evaluation->coefficient,
                'max_grade' => (float) $evaluation->max_grade,
                'evaluation_date' => $evaluation->evaluation_date?->format('Y-m-d'),
            ],
            'students' => $students->map(fn (User $student) => [
                'id' => $student->id,
                'name' => $student->name,
                'student_number' => $student->studentProfile?->student_number,
                'grade' => $student->studentGrades
                    ->firstWhere('evaluation_id', $evaluation->id)?->grade,
                'remarks' => $student->studentGrades
                    ->firstWhere('evaluation_id', $evaluation->id)?->remarks,
                'subject_average' => $evaluation->term_id
                    ? $this->gradeService->calculateStudentAverage(
                        $student->id,
                        $evaluation->subject_id,
                        $evaluation->term_id,
                    )
                    : null,
                'general_average' => $evaluation->term_id
                    ? $this->gradeService->calculateGeneralAverage(
                        $student->id,
                        $evaluation->term_id,
                    )
                    : null,
            ])->values()->all(),
        ]);
    }

    public function store(StoreGradeRequest $request, Evaluation $evaluation): RedirectResponse
    {
        $evaluation = $this->resolveEvaluation($request, $evaluation);
        $evaluation->loadMissing('schoolClass');

        DB::transaction(function () use ($evaluation, $request) {
            $this->gradeService->upsertEvaluationGrades(
                $evaluation,
                $request->validated('grades'),
                $request->user()->id,
            );
        });

        $this->activityLogService->log(
            $request->user(),
            'grades.saved',
            "Saved grades for evaluation {$evaluation->title}.",
            $evaluation,
            ['evaluation_id' => $evaluation->id],
        );

        return redirect()
            ->route('evaluations.grades.edit', $evaluation)
            ->with('success', 'Grades saved successfully.');
    }

    public function update(
        UpdateGradeRequest $request,
        Evaluation $evaluation,
        Grade $grade,
    ): RedirectResponse {
        $evaluation = $this->resolveEvaluation($request, $evaluation);
        abort_unless($grade->evaluation_id === $evaluation->id, 404);

        $payload = $request->validated();

        if (Schema::hasColumn('grades', 'updated_by')) {
            $payload['updated_by'] = $request->user()->id;
        }

        $grade->update($payload);

        $this->activityLogService->log(
            $request->user(),
            'grade.updated',
            "Updated a grade for evaluation {$evaluation->title}.",
            $grade,
            ['evaluation_id' => $evaluation->id, 'grade_id' => $grade->id],
        );

        return redirect()
            ->route('evaluations.grades.edit', $evaluation)
            ->with('success', 'Grade updated successfully.');
    }

    public function destroy(
        Request $request,
        Evaluation $evaluation,
        Grade $grade,
    ): RedirectResponse {
        $evaluation = $this->resolveEvaluation($request, $evaluation);
        abort_unless($grade->evaluation_id === $evaluation->id, 404);

        $grade->delete();

        $this->activityLogService->log(
            $request->user(),
            'grade.deleted',
            "Deleted a grade from evaluation {$evaluation->title}.",
            $grade,
            ['evaluation_id' => $evaluation->id, 'grade_id' => $grade->id],
        );

        return redirect()
            ->route('evaluations.grades.edit', $evaluation)
            ->with('success', 'Grade deleted successfully.');
    }

    private function resolveEvaluation(Request $request, Evaluation $evaluation): Evaluation
    {
        $evaluation->loadMissing(['schoolClass', 'subject', 'term']);

        abort_unless(
            $this->accessService->canManageEvaluation($request->user(), $evaluation),
            403,
        );

        return $evaluation;
    }

    private function studentsForEvaluation(Evaluation $evaluation)
    {
        $query = User::query()
            ->where('establishment_id', $evaluation->establishment_id)
            ->whereHas('roles', fn ($roleQuery) => $roleQuery->where('name', 'student'))
            ->with([
                'studentProfile',
                'studentGrades' => fn ($gradeQuery) => $gradeQuery
                    ->where('evaluation_id', $evaluation->id),
            ]);

        if (Schema::hasTable('class_students')) {
            $query->whereExists(function ($subQuery) use ($evaluation) {
                $subQuery
                    ->selectRaw('1')
                    ->from('class_students')
                    ->whereColumn('class_students.student_id', 'users.id')
                    ->where('class_students.class_id', $evaluation->class_id);
            });
        } else {
            $query->whereHas('studentProfile', fn ($profileQuery) => $profileQuery
                ->where('class_id', $evaluation->class_id));
        }

        return $query->orderBy('name')->get();
    }
}
