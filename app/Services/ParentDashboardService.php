<?php

namespace App\Services;

use App\Models\Attendance;
use App\Models\Grade;
use App\Models\StudentProfile;
use App\Models\StudentRiskPrediction;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

class ParentDashboardService
{
    public function __construct(
        private readonly ParentStudentAccessService $access,
        private readonly AssignmentService $assignments,
        private readonly NotificationCenterService $notifications,
        private readonly MessagingService $messaging,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function buildFor(User $parent, ?int $studentId): array
    {
        $parent->loadMissing('establishment:id,name');
        $children = $this->access->linkedStudents($parent);
        $selected = $this->access->resolveLinkedStudent($parent, $studentId);
        $conversations = $this->messaging->conversationsFor($parent);

        return [
            'parent' => [
                'name' => $parent->name,
                'email' => $parent->email,
                'establishment_name' => $parent->establishment?->name,
                'children_count' => $children->count(),
            ],
            'children' => $children->map(fn (StudentProfile $child) => [
                'id' => $child->user_id,
                'name' => $child->user?->name,
                'class_name' => $child->schoolClass?->name,
                'photo_url' => $child->photo_url,
            ])->values()->all(),
            'selected_student_id' => $selected?->user_id,
            'student' => $selected ? $this->studentData($parent, $selected) : null,
            'notifications' => [
                'unread_count' => $this->notifications->unreadCountFor($parent),
                'recent' => $this->notifications->recentFor($parent, 4)->all(),
            ],
            'messages' => [
                'unread_count' => $conversations->sum('unread_count'),
                'recent' => $conversations->take(4)->values()->all(),
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function studentData(User $parent, StudentProfile $profile): array
    {
        $student = $profile->user;
        $establishmentId = (int) $parent->establishment_id;

        $assignmentRows = $this->assignments
            ->visibleAssignmentsForStudentQuery($student)
            ->with([
                'subject:id,name',
                'submissions' => fn ($query) => $query
                    ->where('student_id', $student->id)
                    ->select(['id', 'assignment_id', 'student_id', 'submitted_at']),
            ])
            ->where(fn (Builder $query) => $query
                ->whereNull('due_date')
                ->orWhereDate('due_date', '>=', now()->toDateString()))
            ->orderByRaw('due_date is null')
            ->orderBy('due_date')
            ->limit(5)
            ->get();

        $attendanceQuery = Attendance::query()
            ->forEstablishment($establishmentId)
            ->where('student_id', $student->id);

        $attendanceCounts = (clone $attendanceQuery)
            ->selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        $incidents = (clone $attendanceQuery)
            ->whereIn('status', [Attendance::STATUS_ABSENT, Attendance::STATUS_LATE])
            ->latest('recorded_at')
            ->limit(4)
            ->get(['id', 'status', 'recorded_at', 'justification'])
            ->map(fn (Attendance $attendance) => [
                'id' => $attendance->id,
                'status' => $attendance->status,
                'recorded_at' => $attendance->recorded_at?->toIso8601String(),
                'justification' => $attendance->justification,
            ])->values()->all();

        $average = Grade::query()
            ->whereHas(
                'evaluation',
                fn (Builder $query) => $query->where('establishment_id', $establishmentId),
            )
            ->where('student_id', $student->id)
            ->avg('grade');

        $risk = StudentRiskPrediction::query()
            ->where('establishment_id', $establishmentId)
            ->where('student_id', $profile->id)
            ->latest('analyzed_at')
            ->value('risk_level');

        $assignments = $assignmentRows->map(function ($assignment) use ($student) {
            $submitted = $assignment->submissions->contains('student_id', $student->id);

            return [
                'id' => $assignment->id,
                'title' => $assignment->title,
                'subject' => $assignment->subject?->name,
                'due_date' => $assignment->due_date?->format('Y-m-d'),
                'status' => $submitted ? 'submitted' : 'pending',
            ];
        })->values()->all();

        return [
            'name' => $student->name,
            'class_name' => $profile->schoolClass?->name,
            'assignments' => $assignments,
            'summary' => [
                'average' => $average !== null ? round((float) $average, 2) : null,
                'present_count' => (int) ($attendanceCounts[Attendance::STATUS_PRESENT] ?? 0),
                'absence_count' => (int) ($attendanceCounts[Attendance::STATUS_ABSENT] ?? 0),
                'late_count' => (int) ($attendanceCounts[Attendance::STATUS_LATE] ?? 0),
                'assignments_due_count' => collect($assignments)->where('status', 'pending')->count(),
                'risk_level' => $risk,
            ],
            'attendance_incidents' => $incidents,
        ];
    }
}
