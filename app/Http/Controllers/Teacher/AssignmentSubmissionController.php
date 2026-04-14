<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Models\Assignment;
use App\Models\AssignmentSubmission;
use App\Services\AssignmentService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AssignmentSubmissionController extends Controller
{
    public function __construct(
        private readonly AssignmentService $assignmentService,
    ) {
    }

    public function index(Request $request): Response
    {
        $teacher = $request->user();
        $filters = [
            'class_id' => (string) $request->string('class_id'),
            'subject_id' => (string) $request->string('subject_id'),
            'assignment_id' => (string) $request->string('assignment_id'),
            'status' => (string) $request->string('status'),
            'search' => trim((string) $request->string('search')),
        ];

        $rows = DB::table('assignments')
            ->join('classes', 'classes.id', '=', 'assignments.class_id')
            ->join('subjects', 'subjects.id', '=', 'assignments.subject_id')
            ->join('class_students', 'class_students.class_id', '=', 'assignments.class_id')
            ->join('users as students', 'students.id', '=', 'class_students.student_id')
            ->leftJoin('student_profiles', function ($join) {
                $join->on('student_profiles.user_id', '=', 'students.id')
                    ->whereNull('student_profiles.deleted_at');
            })
            ->leftJoin('assignment_submissions', function ($join) {
                $join->on('assignment_submissions.assignment_id', '=', 'assignments.id')
                    ->on('assignment_submissions.student_id', '=', 'students.id')
                    ->on('assignment_submissions.establishment_id', '=', 'assignments.establishment_id');
            })
            ->where('assignments.establishment_id', $teacher->establishment_id)
            ->where('classes.establishment_id', $teacher->establishment_id)
            ->where('subjects.establishment_id', $teacher->establishment_id)
            ->where('students.establishment_id', $teacher->establishment_id)
            ->where(function ($query) use ($teacher) {
                $query
                    ->whereNull('student_profiles.id')
                    ->orWhere('student_profiles.establishment_id', $teacher->establishment_id);
            })
            ->whereExists(function ($subQuery) use ($teacher) {
                $subQuery
                    ->selectRaw('1')
                    ->from('class_subjects')
                    ->whereColumn('class_subjects.class_id', 'assignments.class_id')
                    ->whereColumn('class_subjects.subject_id', 'assignments.subject_id')
                    ->where('class_subjects.teacher_id', $teacher->id);
            })
            ->when($filters['class_id'] !== '', fn ($query) => $query->where('assignments.class_id', $filters['class_id']))
            ->when($filters['subject_id'] !== '', fn ($query) => $query->where('assignments.subject_id', $filters['subject_id']))
            ->when($filters['assignment_id'] !== '', fn ($query) => $query->where('assignments.id', $filters['assignment_id']))
            ->when($filters['search'] !== '', function ($query) use ($filters) {
                $search = $filters['search'];

                $query->where(function ($subQuery) use ($search) {
                    $subQuery
                        ->where('assignments.title', 'like', "%{$search}%")
                        ->orWhere('subjects.name', 'like', "%{$search}%")
                        ->orWhere('classes.name', 'like', "%{$search}%")
                        ->orWhere('students.name', 'like', "%{$search}%")
                        ->orWhere('student_profiles.student_number', 'like', "%{$search}%");
                });
            })
            ->when($filters['status'] !== '', function ($query) use ($filters) {
                if ($filters['status'] === 'pending') {
                    $query->whereNull('assignment_submissions.id');
                }

                if ($filters['status'] === 'submitted') {
                    $query->whereNotNull('assignment_submissions.id')
                        ->whereRaw('DATE(assignment_submissions.submitted_at) <= assignments.due_date');
                }

                if ($filters['status'] === 'late') {
                    $query->whereNotNull('assignment_submissions.id')
                        ->whereRaw('DATE(assignment_submissions.submitted_at) > assignments.due_date');
                }
            })
            ->select([
                'assignments.id as assignment_id',
                'assignments.title as assignment_title',
                'assignments.due_date',
                'classes.name as class_name',
                'subjects.name as subject_name',
                'students.name as student_name',
                'student_profiles.student_number',
                'assignment_submissions.id as submission_id',
                'assignment_submissions.submitted_at',
                'assignment_submissions.attachment_original_name',
            ])
            ->orderBy('assignments.due_date')
            ->orderBy('assignments.id')
            ->orderBy('students.name')
            ->paginate(15)
            ->withQueryString()
            ->through(function ($row) {
                $isSubmitted = $row->submission_id !== null;
                $isLate = $isSubmitted && $row->submitted_at !== null
                    ? Carbon::parse($row->submitted_at)->toDateString() > $row->due_date
                    : false;

                return [
                    'assignment_id' => (int) $row->assignment_id,
                    'assignment_title' => $row->assignment_title,
                    'class_name' => $row->class_name,
                    'subject_name' => $row->subject_name,
                    'student_name' => $row->student_name,
                    'student_number' => $row->student_number,
                    'due_date' => $row->due_date,
                    'status' => $isSubmitted ? ($isLate ? 'late' : 'submitted') : 'pending',
                    'submission' => $isSubmitted ? [
                        'id' => (int) $row->submission_id,
                        'submitted_at' => $row->submitted_at ? Carbon::parse($row->submitted_at)->format('Y-m-d H:i') : null,
                        'attachment_original_name' => $row->attachment_original_name,
                        'download_url' => route('teacher.assignment-submissions.download', [
                            'assignment' => $row->assignment_id,
                            'submission' => $row->submission_id,
                        ]),
                    ] : null,
                ];
            });

        return Inertia::render('Teacher/AssignmentSubmissions/Index', [
            'filters' => $filters,
            'submissions' => $rows,
            'assignmentOptions' => $this->assignmentService->assignmentOptions($teacher),
            'assignmentFilterOptions' => $this->assignmentService->visibleAssignmentsQuery($teacher)
                ->with(['schoolClass:id,name', 'subject:id,name'])
                ->orderBy('due_date')
                ->orderByDesc('id')
                ->get()
                ->map(fn (Assignment $assignment) => [
                    'id' => $assignment->id,
                    'class_id' => $assignment->class_id,
                    'subject_id' => $assignment->subject_id,
                    'label' => sprintf(
                        '%s - %s - %s',
                        $assignment->title,
                        $assignment->schoolClass?->name ?? 'Class',
                        $assignment->subject?->name ?? 'Subject',
                    ),
                ])
                ->values()
                ->all(),
        ]);
    }

    public function download(Request $request, Assignment $assignment, AssignmentSubmission $submission): StreamedResponse
    {
        abort_unless($this->assignmentService->canManageAssignment($request->user(), $assignment), 403);
        abort_unless((int) $submission->assignment_id === (int) $assignment->id, 404);
        abort_unless((int) $submission->establishment_id === (int) $request->user()->establishment_id, 403);
        abort_unless(Storage::disk('public')->exists($submission->attachment_path), 404);

        return Storage::disk('public')->download(
            $submission->attachment_path,
            $submission->attachment_original_name,
        );
    }
}
