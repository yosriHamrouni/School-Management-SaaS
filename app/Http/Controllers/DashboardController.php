<?php

namespace App\Http\Controllers;

use App\Models\Establishment;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\SchoolClass;
use App\Models\Schedule;
use App\Models\StudentProfile;
use App\Models\StudentRiskPrediction;
use App\Models\User;
use App\Services\AssignmentService;
use App\Services\MessagingService;
use App\Services\NotificationCenterService;
use App\Services\ParentDashboardService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(
        Request $request,
        AssignmentService $assignmentService,
        NotificationCenterService $notificationCenter,
        MessagingService $messagingService,
        ParentDashboardService $parentDashboardService,
    ): Response
    {
        $user = $request->user();
        $roles = $user->roles->pluck('name');
        $establishmentId = $user->establishment_id;

        if ($roles->contains('student')) {
            return Inertia::render('dashboard', [
                'studentDashboard' => $this->studentDashboardData(
                    $user,
                    $assignmentService,
                    $notificationCenter,
                    $messagingService,
                ),
            ]);
        }

        if ($roles->contains('parent')) {
            $studentId = $request->integer('student') ?: null;

            return Inertia::render('dashboard', [
                'parentDashboard' => $parentDashboardService->buildFor($user, $studentId),
            ]);
        }

        return Inertia::render('dashboard', [
            'dashboardStats' => [
                'students' => $establishmentId
                    ? StudentProfile::query()
                        ->where('establishment_id', $establishmentId)
                        ->count()
                    : null,
                'teachers' => $establishmentId
                    ? $this->countUsersByRoleForEstablishment('teacher', $establishmentId)
                    : null,
                'classes' => $establishmentId
                    ? SchoolClass::query()
                        ->where('establishment_id', $establishmentId)
                        ->count()
                    : null,
                'parents' => $establishmentId
                    ? $this->countUsersByRoleForEstablishment('parent', $establishmentId)
                    : null,
                'payments' => $establishmentId
                    ? Payment::query()
                        ->where('establishment_id', $establishmentId)
                        ->count()
                    : null,
                'invoices' => $establishmentId
                    ? Invoice::query()
                        ->where('establishment_id', $establishmentId)
                        ->count()
                    : null,
                'atRiskStudents' => $establishmentId
                    ? StudentRiskPrediction::query()
                        ->where('establishment_id', $establishmentId)
                        ->where('risk_level', 'high')
                        ->distinct('student_id')
                        ->count('student_id')
                    : null,
                'establishments' => $roles->contains('platform_admin')
                    ? Establishment::query()->count()
                    : null,
                'users' => $roles->contains('platform_admin')
                    ? User::query()->count()
                    : null,
            ],
        ]);
    }

    private function countUsersByRoleForEstablishment(string $role, int $establishmentId): int
    {
        return User::query()
            ->where('establishment_id', $establishmentId)
            ->whereHas('roles', fn ($query) => $query->where('name', $role))
            ->count();
    }

    /**
     * @return array<string, mixed>
     */
    private function studentDashboardData(
        User $student,
        AssignmentService $assignmentService,
        NotificationCenterService $notificationCenter,
        MessagingService $messagingService,
    ): array {
        $student->loadMissing([
            'establishment:id,name',
            'studentProfile.schoolClass:id,name',
        ]);

        $profile = $student->studentProfile;
        $classId = $profile?->class_id;
        $establishmentId = (int) $student->establishment_id;
        $today = now();

        $todaySchedule = $classId && $establishmentId
            ? Schedule::query()
                ->with([
                    'subject:id,name',
                    'teacher:id,name',
                    'schoolClass:id,name',
                ])
                ->forEstablishment($establishmentId)
                ->where('class_id', $classId)
                ->whereRaw('LOWER(day_of_week) = ?', [strtolower($today->englishDayOfWeek)])
                ->orderBy('start_time')
                ->orderBy('end_time')
                ->limit(6)
                ->get()
                ->map(fn (Schedule $schedule) => [
                    'id' => $schedule->id,
                    'subject' => $schedule->subject?->name,
                    'teacher' => $schedule->teacher?->name,
                    'room' => null,
                    'start_time' => $this->formatTime($schedule->start_time),
                    'end_time' => $this->formatTime($schedule->end_time),
                ])
                ->values()
                ->all()
            : [];

        $assignments = $assignmentService
            ->visibleAssignmentsForStudentQuery($student)
            ->with([
                'subject:id,name',
                'submissions' => fn ($query) => $query
                    ->where('student_id', $student->id)
                    ->select(['id', 'assignment_id', 'student_id', 'submitted_at']),
            ])
            ->where(function (Builder $query) use ($today) {
                $query
                    ->whereNull('due_date')
                    ->orWhereDate('due_date', '>=', $today->toDateString());
            })
            ->orderByRaw('due_date is null')
            ->orderBy('due_date')
            ->orderByDesc('id')
            ->limit(5)
            ->get()
            ->map(function ($assignment) use ($student) {
                $submission = $assignment->submissions->firstWhere('student_id', $student->id);

                return [
                    'id' => $assignment->id,
                    'title' => $assignment->title,
                    'subject' => $assignment->subject?->name,
                    'due_date' => $assignment->due_date?->format('Y-m-d'),
                    'status' => $submission ? 'submitted' : 'pending',
                ];
            })
            ->values()
            ->all();

        $conversations = $messagingService->conversationsFor($student);
        $unreadNotificationsCount = $notificationCenter->unreadCountFor($student);

        return [
            'profile' => [
                'name' => $student->name,
                'email' => $student->email,
                'class_name' => $profile?->schoolClass?->name,
                'establishment_name' => $student->establishment?->name,
                'role' => 'student',
            ],
            'todaySchedule' => $todaySchedule,
            'assignments' => $assignments,
            'notifications' => [
                'unread_count' => $unreadNotificationsCount,
                'recent' => $notificationCenter->recentFor($student, 4)->all(),
            ],
            'messages' => [
                'unread_count' => $conversations->sum('unread_count'),
                'recent' => $conversations->take(4)->values()->all(),
            ],
            'summary' => [
                'assignments_due_count' => count(array_filter(
                    $assignments,
                    fn (array $assignment) => $assignment['status'] === 'pending',
                )),
                'today_sessions_count' => count($todaySchedule),
                'notifications_unread_count' => $unreadNotificationsCount,
                'recent_messages_count' => $conversations->count(),
                'next_session' => $todaySchedule[0] ?? null,
            ],
        ];
    }

    private function formatTime(?string $time): ?string
    {
        if (! $time) {
            return null;
        }

        return substr($time, 0, 5);
    }
}
