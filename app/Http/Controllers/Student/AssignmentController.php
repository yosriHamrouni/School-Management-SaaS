<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Http\Requests\Student\StoreAssignmentSubmissionRequest;
use App\Models\Assignment;
use App\Models\User;
use App\Services\ActivityLogService;
use App\Services\AssignmentService;
use App\Services\AssignmentSubmissionService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class AssignmentController extends Controller
{
    public function __construct(
        private readonly AssignmentService $assignmentService,
        private readonly AssignmentSubmissionService $submissionService,
        private readonly ActivityLogService $activityLogService,
    ) {
    }

    public function index(Request $request): Response
    {
        $student = $request->user();
        $filters = [
            'search' => trim((string) $request->string('search')),
            'status' => (string) $request->string('status'),
        ];

        $assignments = $this->assignmentService
            ->visibleAssignmentsForStudentQuery($student)
            ->with([
                'subject:id,name',
                'schoolClass:id,name',
                'academicYear:id,name',
                'submissions' => fn ($query) => $query
                    ->where('student_id', $student->id)
                    ->select([
                        'id',
                        'assignment_id',
                        'student_id',
                        'attachment_original_name',
                        'submitted_at',
                    ]),
            ])
            ->when($filters['search'] !== '', function (Builder $query) use ($filters) {
                $search = $filters['search'];

                $query->where(function (Builder $subQuery) use ($search) {
                    $subQuery
                        ->where('title', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%")
                        ->orWhereHas('subject', fn (Builder $subjectQuery) => $subjectQuery->where('name', 'like', "%{$search}%"));
                });
            })
            ->when($filters['status'] !== '', function (Builder $query) use ($filters, $student) {
                if ($filters['status'] === 'submitted') {
                    $query->whereHas('submissions', fn (Builder $submissionQuery) => $submissionQuery->where('student_id', $student->id));
                }

                if ($filters['status'] === 'pending') {
                    $query->whereDoesntHave('submissions', fn (Builder $submissionQuery) => $submissionQuery->where('student_id', $student->id));
                }
            })
            ->orderBy('due_date')
            ->orderByDesc('id')
            ->paginate(12)
            ->withQueryString()
            ->through(function (Assignment $assignment) {
                $submission = $assignment->submissions->first();
                $isOverdue = $assignment->due_date
                    ? now()->greaterThan($assignment->due_date->copy()->endOfDay())
                    : false;
                $submittedAt = $submission?->submitted_at;

                return [
                    'id' => $assignment->id,
                    'title' => $assignment->title,
                    'description' => $assignment->description,
                    'subject_name' => $assignment->subject?->name,
                    'class_name' => $assignment->schoolClass?->name,
                    'academic_year_name' => $assignment->academicYear?->name,
                    'due_date' => $assignment->due_date?->format('Y-m-d'),
                    'is_overdue' => $isOverdue,
                    'submission' => $submission ? [
                        'id' => $submission->id,
                        'attachment_original_name' => $submission->attachment_original_name,
                        'submitted_at' => $submittedAt?->format('Y-m-d H:i'),
                        'is_late' => $submittedAt && $assignment->due_date
                            ? $submittedAt->greaterThan($assignment->due_date->copy()->endOfDay())
                            : false,
                    ] : null,
                ];
            });

        return Inertia::render('Student/Assignments/Index', [
            'filters' => $filters,
            'assignments' => $assignments,
            'className' => $student->loadMissing('studentProfile.schoolClass')->studentProfile?->schoolClass?->name,
        ]);
    }

    public function show(Request $request, Assignment $assignment): Response
    {
        $student = $request->user();
        $assignment = $this->resolveAssignment($student, $assignment);

        $submission = $assignment->submissions()
            ->where('student_id', $student->id)
            ->first();

        return Inertia::render('Student/Assignments/Show', [
            'assignment' => [
                'id' => $assignment->id,
                'title' => $assignment->title,
                'description' => $assignment->description,
                'due_date' => $assignment->due_date?->format('Y-m-d'),
                'subject_name' => $assignment->subject?->name,
                'class_name' => $assignment->schoolClass?->name,
                'academic_year_name' => $assignment->academicYear?->name,
                'is_overdue' => $assignment->due_date
                    ? now()->greaterThan($assignment->due_date->copy()->endOfDay())
                    : false,
            ],
            'submission' => $submission ? [
                'id' => $submission->id,
                'submission_text' => $submission->submission_text,
                'attachment_original_name' => $submission->attachment_original_name,
                'attachment_url' => Storage::disk('public')->url($submission->attachment_path),
                'submitted_at' => $submission->submitted_at?->format('Y-m-d H:i'),
                'is_late' => $assignment->due_date && $submission->submitted_at
                    ? $submission->submitted_at->greaterThan($assignment->due_date->copy()->endOfDay())
                    : false,
            ] : null,
        ]);
    }

    public function storeSubmission(
        StoreAssignmentSubmissionRequest $request,
        Assignment $assignment,
    ): RedirectResponse {
        $student = $request->user();
        $assignment = $this->resolveAssignment($student, $assignment);

        $submission = $this->submissionService->storeForStudent(
            $student,
            $assignment,
            $request->file('attachment'),
            $request->string('submission_text')->trim()->value() ?: null,
        );

        $this->activityLogService->log(
            $student,
            'assignment.submitted',
            "Submitted assignment {$assignment->title}.",
            $submission,
            [
                'assignment_id' => $assignment->id,
                'submission_id' => $submission->id,
                'student_id' => $student->id,
            ],
        );

        return redirect()
            ->route('student.assignments.show', $assignment)
            ->with('success', 'Assignment submitted successfully.');
    }

    private function resolveAssignment(User $student, Assignment $assignment): Assignment
    {
        $assignment->loadMissing(['subject:id,name', 'schoolClass:id,name', 'academicYear:id,name']);

        abort_unless($this->assignmentService->canStudentViewAssignment($student, $assignment), 403);

        return $assignment;
    }
}
