<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Http\Requests\Teacher\StoreAssignmentRequest;
use App\Http\Requests\Teacher\UpdateAssignmentRequest;
use App\Models\Assignment;
use App\Services\ActivityLogService;
use App\Services\AssignmentNotificationService;
use App\Services\AssignmentService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class AssignmentController extends Controller
{
    public function __construct(
        private readonly AssignmentService $assignmentService,
        private readonly AssignmentNotificationService $notificationService,
        private readonly ActivityLogService $activityLogService,
    ) {
    }

    public function index(Request $request): Response
    {
        $teacher = $request->user();
        $filters = [
            'search' => trim((string) $request->string('search')),
            'class_id' => (string) $request->string('class_id'),
            'subject_id' => (string) $request->string('subject_id'),
        ];

        $assignments = $this->assignmentService
            ->visibleAssignmentsQuery($teacher)
            ->with(['schoolClass:id,name', 'subject:id,name', 'academicYear:id,name'])
            ->when($filters['search'] !== '', function (Builder $query) use ($filters) {
                $search = $filters['search'];

                $query->where(function (Builder $subQuery) use ($search) {
                    $subQuery
                        ->where('title', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%")
                        ->orWhereHas('schoolClass', fn (Builder $classQuery) => $classQuery->where('name', 'like', "%{$search}%"))
                        ->orWhereHas('subject', fn (Builder $subjectQuery) => $subjectQuery->where('name', 'like', "%{$search}%"));
                });
            })
            ->when($filters['class_id'] !== '', fn (Builder $query) => $query->where('class_id', $filters['class_id']))
            ->when($filters['subject_id'] !== '', fn (Builder $query) => $query->where('subject_id', $filters['subject_id']))
            ->orderBy('due_date')
            ->orderByDesc('id')
            ->paginate(12)
            ->withQueryString()
            ->through(fn (Assignment $assignment) => [
                'id' => $assignment->id,
                'title' => $assignment->title,
                'class_name' => $assignment->schoolClass?->name,
                'subject_name' => $assignment->subject?->name,
                'academic_year_name' => $assignment->academicYear?->name,
                'description' => $assignment->description,
                'due_date' => $assignment->due_date?->format('Y-m-d'),
                'is_overdue' => $assignment->due_date?->isPast() ?? false,
            ]);

        return Inertia::render('Teacher/Assignments/Index', [
            'filters' => $filters,
            'assignments' => $assignments,
            'assignmentOptions' => $this->assignmentService->assignmentOptions($teacher),
        ]);
    }

    public function create(Request $request): Response
    {
        $teacher = $request->user();

        return Inertia::render('Teacher/Assignments/Create', [
            'assignmentOptions' => $this->assignmentService->assignmentOptions($teacher),
            'activeAcademicYear' => $this->assignmentService->activeAcademicYear($teacher)?->only(['id', 'name']),
        ]);
    }

    public function store(StoreAssignmentRequest $request): RedirectResponse
    {
        $teacher = $request->user();
        $academicYear = $this->assignmentService->activeAcademicYear($teacher);

        if (! $academicYear) {
            return redirect()
                ->back()
                ->withErrors(['class_id' => 'No active academic year is configured for your establishment.']);
        }

        $assignment = DB::transaction(function () use ($request, $teacher, $academicYear) {
            $assignment = Assignment::query()->create([
                ...$request->validated(),
                'establishment_id' => $teacher->establishment_id,
                'academic_year_id' => $academicYear->id,
            ]);

            $notificationCount = $this->notificationService->notifyClassStudents($assignment);

            $this->activityLogService->log(
                $teacher,
                'assignment.created',
                "Created assignment {$assignment->title}.",
                $assignment,
                [
                    'assignment_id' => $assignment->id,
                    'class_id' => $assignment->class_id,
                    'subject_id' => $assignment->subject_id,
                    'notifications_created' => $notificationCount,
                ],
            );

            return $assignment;
        });

        return redirect()
            ->route('teacher.assignments.index')
            ->with('success', "Assignment created successfully for {$assignment->due_date?->format('Y-m-d')}.");
    }

    public function edit(Request $request, Assignment $assignment): Response
    {
        $assignment = $this->resolveAssignment($request, $assignment);

        return Inertia::render('Teacher/Assignments/Edit', [
            'assignment' => [
                'id' => $assignment->id,
                'class_id' => $assignment->class_id,
                'subject_id' => $assignment->subject_id,
                'title' => $assignment->title,
                'description' => $assignment->description,
                'due_date' => $assignment->due_date?->format('Y-m-d'),
            ],
            'assignmentOptions' => $this->assignmentService->assignmentOptions($request->user()),
            'activeAcademicYear' => $this->assignmentService->activeAcademicYear($request->user())?->only(['id', 'name']),
        ]);
    }

    public function update(UpdateAssignmentRequest $request, Assignment $assignment): RedirectResponse
    {
        $assignment = $this->resolveAssignment($request, $assignment);
        $assignment->update($request->validated());

        $this->activityLogService->log(
            $request->user(),
            'assignment.updated',
            "Updated assignment {$assignment->title}.",
            $assignment,
            [
                'assignment_id' => $assignment->id,
                'class_id' => $assignment->class_id,
                'subject_id' => $assignment->subject_id,
            ],
        );

        return redirect()
            ->route('teacher.assignments.index')
            ->with('success', 'Assignment updated successfully.');
    }

    public function destroy(Request $request, Assignment $assignment): RedirectResponse
    {
        $assignment = $this->resolveAssignment($request, $assignment);
        $title = $assignment->title;
        $assignmentId = $assignment->id;

        $assignment->delete();

        $this->activityLogService->log(
            $request->user(),
            'assignment.deleted',
            "Deleted assignment {$title}.",
            $assignment,
            ['assignment_id' => $assignmentId],
        );

        return redirect()
            ->route('teacher.assignments.index')
            ->with('success', 'Assignment deleted successfully.');
    }

    private function resolveAssignment(Request $request, Assignment $assignment): Assignment
    {
        $assignment->loadMissing(['schoolClass', 'subject', 'academicYear']);

        abort_unless(
            $this->assignmentService->canManageAssignment($request->user(), $assignment),
            403,
        );

        return $assignment;
    }
}
