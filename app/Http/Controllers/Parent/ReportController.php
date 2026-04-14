<?php

namespace App\Http\Controllers\Parent;

use App\Http\Controllers\Controller;
use App\Models\Term;
use App\Services\BulletinService;
use App\Services\ParentStudentAccessService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ReportController extends Controller
{
    public function __construct(
        private readonly BulletinService $bulletinService,
        private readonly ParentStudentAccessService $parentStudentAccessService,
    ) {
    }

    public function index(Request $request, ?int $student = null): Response
    {
        $parent = $request->user();
        $children = $this->parentStudentAccessService->linkedStudents($parent);
        $selectedStudent = $this->parentStudentAccessService->resolveLinkedStudent($parent, $student);

        $terms = Term::query()
            ->where('establishment_id', $parent->establishment_id)
            ->orderBy('name')
            ->get(['id', 'name']);

        $selectedTermId = (int) ($request->integer('term_id') ?: ($terms->first()->id ?? 0));
        $report = $selectedStudent && $selectedTermId > 0
            ? $this->bulletinService->getStudentReport($selectedStudent->user_id, $selectedTermId)
            : null;

        return Inertia::render('Parent/Reports/Index', [
            'children' => $children->map(fn ($child) => [
                'id' => $child->user_id,
                'name' => $child->user?->name,
                'student_number' => $child->student_number,
                'class_name' => $child->schoolClass?->name,
            ])->values()->all(),
            'selectedChildId' => $selectedStudent?->user_id,
            'terms' => $terms->map(fn (Term $term) => [
                'id' => $term->id,
                'name' => $term->name,
            ])->all(),
            'selectedTermId' => $selectedTermId > 0 ? $selectedTermId : null,
            'report' => $report,
        ]);
    }
}
