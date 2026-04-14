<?php

namespace App\Http\Controllers;

use App\Models\StudentProfile;
use App\Models\Term;
use App\Services\BulletinService;
use App\Services\EvaluationAccessService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ReportController extends Controller
{
    public function __construct(
        private readonly BulletinService $bulletinService,
        private readonly EvaluationAccessService $accessService,
    ) {
    }

    public function showStudent(Request $request, int $student): Response
    {
        $user = $request->user();
        abort_unless(
            $user->hasRole('establishment_admin') || $user->hasRole('teacher'),
            403,
        );
        abort_unless($this->accessService->canAccessStudent($user, $student), 403);

        $terms = Term::query()
            ->where('establishment_id', $user->establishment_id)
            ->orderBy('name')
            ->get(['id', 'name']);

        $selectedTermId = (int) ($request->integer('term_id') ?: ($terms->first()->id ?? 0));
        $studentProfile = StudentProfile::query()
            ->with(['user', 'schoolClass'])
            ->where('user_id', $student)
            ->firstOrFail();

        $report = $selectedTermId > 0
            ? $this->bulletinService->getStudentReport($student, $selectedTermId)
            : null;

        return Inertia::render('Reports/StudentReport', [
            'student' => [
                'id' => $studentProfile->user_id,
                'name' => $studentProfile->user?->name,
                'student_number' => $studentProfile->student_number,
                'class_name' => $studentProfile->schoolClass?->name,
            ],
            'terms' => $terms->map(fn (Term $term) => [
                'id' => $term->id,
                'name' => $term->name,
            ])->all(),
            'selectedTermId' => $selectedTermId > 0 ? $selectedTermId : null,
            'report' => $report,
        ]);
    }
}
