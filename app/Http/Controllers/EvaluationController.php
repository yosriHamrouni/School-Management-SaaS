<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreEvaluationRequest;
use App\Models\Evaluation;
use App\Models\Term;
use App\Services\ActivityLogService;
use App\Services\EvaluationAccessService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EvaluationController extends Controller
{
    public function __construct(
        private readonly EvaluationAccessService $accessService,
        private readonly ActivityLogService $activityLogService,
    ) {
    }

    public function index(Request $request): Response
    {
        $user = $request->user();
        $search = trim((string) $request->string('search'));
        $classId = (string) $request->string('class_id');
        $subjectId = (string) $request->string('subject_id');
        $termId = (string) $request->string('term_id');
        $type = (string) $request->string('type');

        $evaluations = $this->accessService
            ->visibleEvaluationsQuery($user)
            ->with(['schoolClass', 'subject', 'term'])
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($subQuery) use ($search) {
                    $subQuery
                        ->where('title', 'like', "%{$search}%")
                        ->orWhere('type', 'like', "%{$search}%");
                });
            })
            ->when($classId !== '', fn ($query) => $query->where('class_id', $classId))
            ->when($subjectId !== '', fn ($query) => $query->where('subject_id', $subjectId))
            ->when($termId !== '', fn ($query) => $query->where('term_id', $termId))
            ->when($type !== '', fn ($query) => $query->where('type', $type))
            ->orderByDesc('evaluation_date')
            ->paginate(10)
            ->withQueryString()
            ->through(fn (Evaluation $evaluation) => [
                'id' => $evaluation->id,
                'title' => $evaluation->title,
                'class_name' => $evaluation->schoolClass?->name,
                'subject_name' => $evaluation->subject?->name,
                'term_name' => $evaluation->term?->name,
                'type' => $evaluation->type,
                'coefficient' => (float) $evaluation->coefficient,
                'max_grade' => (float) $evaluation->max_grade,
                'evaluation_date' => $evaluation->evaluation_date?->format('Y-m-d'),
            ]);

        return Inertia::render('Evaluations/Index', [
            'filters' => [
                'search' => $search,
                'class_id' => $classId,
                'subject_id' => $subjectId,
                'term_id' => $termId,
                'type' => $type,
            ],
            'evaluations' => $evaluations,
            'assignments' => $this->accessService->assignmentOptions($user),
            'terms' => $this->termOptions($request),
            'canManageAll' => $user->hasRole('establishment_admin'),
        ]);
    }

    public function create(Request $request): Response
    {
        return Inertia::render('Evaluations/Create', [
            'assignments' => $this->accessService->assignmentOptions($request->user()),
            'terms' => $this->termOptions($request),
        ]);
    }

    public function store(StoreEvaluationRequest $request): RedirectResponse
    {
        $evaluation = Evaluation::create([
            ...$request->validated(),
            'establishment_id' => $request->user()->establishment_id,
            'created_by' => $request->user()->id,
            'updated_by' => $request->user()->id,
        ]);

        $this->activityLogService->log(
            $request->user(),
            'evaluation.created',
            "Created evaluation {$evaluation->title}.",
            $evaluation,
            ['evaluation_id' => $evaluation->id],
        );

        return redirect()
            ->route('evaluations.index')
            ->with('success', 'Evaluation created successfully.');
    }

    public function edit(Request $request, Evaluation $evaluation): Response
    {
        $evaluation = $this->resolveEvaluation($request, $evaluation);

        return Inertia::render('Evaluations/Edit', [
            'evaluation' => [
                'id' => $evaluation->id,
                'title' => $evaluation->title,
                'class_id' => $evaluation->class_id,
                'subject_id' => $evaluation->subject_id,
                'term_id' => $evaluation->term_id,
                'type' => $evaluation->type,
                'coefficient' => (string) $evaluation->coefficient,
                'max_grade' => (string) $evaluation->max_grade,
                'evaluation_date' => $evaluation->evaluation_date?->format('Y-m-d'),
                'description' => $evaluation->description,
            ],
            'assignments' => $this->accessService->assignmentOptions($request->user()),
            'terms' => $this->termOptions($request),
        ]);
    }

    public function update(StoreEvaluationRequest $request, Evaluation $evaluation): RedirectResponse
    {
        $evaluation = $this->resolveEvaluation($request, $evaluation);
        $evaluation->update([
            ...$request->validated(),
            'updated_by' => $request->user()->id,
        ]);

        $this->activityLogService->log(
            $request->user(),
            'evaluation.updated',
            "Updated evaluation {$evaluation->title}.",
            $evaluation,
            ['evaluation_id' => $evaluation->id],
        );

        return redirect()
            ->route('evaluations.index')
            ->with('success', 'Evaluation updated successfully.');
    }

    public function destroy(Request $request, Evaluation $evaluation): RedirectResponse
    {
        $evaluation = $this->resolveEvaluation($request, $evaluation);
        $evaluation->delete();

        $this->activityLogService->log(
            $request->user(),
            'evaluation.deleted',
            "Deleted evaluation {$evaluation->title}.",
            $evaluation,
            ['evaluation_id' => $evaluation->id],
        );

        return redirect()
            ->route('evaluations.index')
            ->with('success', 'Evaluation deleted successfully.');
    }

    private function resolveEvaluation(Request $request, Evaluation $evaluation): Evaluation
    {
        abort_unless(
            $this->accessService->canManageEvaluation($request->user(), $evaluation),
            403,
        );

        return $evaluation;
    }

    private function termOptions(Request $request): array
    {
        return Term::query()
            ->where('establishment_id', $request->user()->establishment_id)
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn (Term $term) => [
                'id' => $term->id,
                'name' => $term->name,
            ])
            ->all();
    }
}
