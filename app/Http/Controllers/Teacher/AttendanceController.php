<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Http\Requests\Teacher\StoreAttendanceRequest;
use App\Models\Attendance;
use App\Models\Schedule;
use App\Models\SchoolClass;
use App\Services\AttendanceService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class AttendanceController extends Controller
{
    public function __construct(
        private readonly AttendanceService $attendanceService,
    ) {
    }

    public function index(Request $request): Response
    {
        $teacher = $request->user();
        $filters = [
            'search' => trim((string) $request->string('search')),
            'class_id' => (string) $request->string('class_id'),
            'day_of_week' => (string) $request->string('day_of_week'),
        ];

        $schedules = $this->attendanceService
            ->teacherSchedulesQuery($teacher)
            ->withCount('attendances')
            ->withMax('attendances as last_recorded_at', 'recorded_at')
            ->when($filters['class_id'] !== '', fn (Builder $query) => $query->where('class_id', $filters['class_id']))
            ->when($filters['day_of_week'] !== '', fn (Builder $query) => $query->where('day_of_week', $filters['day_of_week']))
            ->when($filters['search'] !== '', function (Builder $query) use ($filters) {
                $search = $filters['search'];

                $query->where(function (Builder $subQuery) use ($search) {
                    $subQuery
                        ->whereHas('schoolClass', fn (Builder $classQuery) => $classQuery->where('name', 'like', "%{$search}%"))
                        ->orWhereHas('subject', fn (Builder $subjectQuery) => $subjectQuery->where('name', 'like', "%{$search}%"))
                        ->orWhere('day_of_week', 'like', "%{$search}%");
                });
            })
            ->ordered()
            ->paginate(12)
            ->withQueryString()
            ->through(fn (Schedule $schedule) => [
                'id' => $schedule->id,
                'class_name' => $schedule->schoolClass?->name,
                'subject_name' => $schedule->subject?->name,
                'day_of_week' => $schedule->day_of_week,
                'start_time' => substr((string) $schedule->start_time, 0, 5),
                'end_time' => substr((string) $schedule->end_time, 0, 5),
                'attendance_count' => (int) $schedule->attendances_count,
                'last_recorded_at' => $schedule->last_recorded_at,
            ]);

        return Inertia::render('Teacher/Attendances/Index', [
            'filters' => $filters,
            'schedules' => $schedules,
            'classes' => $this->classOptions($teacher->establishment_id, $teacher->id),
            'dayOptions' => Schedule::DAY_OPTIONS,
        ]);
    }

    public function edit(Request $request, Schedule $schedule): Response
    {
        $teacher = $request->user();
        $schedule = $this->resolveSchedule($teacher->id, $teacher->establishment_id, $schedule);
        $schedule->load(['schoolClass:id,name', 'subject:id,name']);

        $students = $this->attendanceService->classStudents($schedule->class_id, $teacher->establishment_id);
        $attendanceMap = Attendance::query()
            ->forEstablishment((int) $teacher->establishment_id)
            ->forTeacher($teacher->id)
            ->where('schedule_id', $schedule->id)
            ->get()
            ->keyBy('student_id');

        $absenceCounts = $this->attendanceService->repeatedAbsenceCountsForStudents(
            (int) $teacher->establishment_id,
            $students->pluck('id')->map(fn ($id) => (int) $id)->all(),
            $teacher->id,
        );

        return Inertia::render('Teacher/Attendances/Edit', [
            'schedule' => [
                'id' => $schedule->id,
                'class_name' => $schedule->schoolClass?->name,
                'subject_name' => $schedule->subject?->name,
                'day_of_week' => $schedule->day_of_week,
                'start_time' => substr((string) $schedule->start_time, 0, 5),
                'end_time' => substr((string) $schedule->end_time, 0, 5),
            ],
            'statusOptions' => Attendance::STATUS_OPTIONS,
            'repeatedAbsenceThreshold' => AttendanceService::REPEATED_ABSENCE_THRESHOLD,
            'students' => $students->map(function (object $student) use ($attendanceMap, $absenceCounts) {
                /** @var Attendance|null $attendance */
                $attendance = $attendanceMap->get($student->id);
                $absenceCount = $absenceCounts[(int) $student->id] ?? 0;

                return [
                    'student_id' => (int) $student->id,
                    'name' => $student->name,
                    'student_number' => $student->student_number,
                    'status' => $attendance?->status ?? Attendance::STATUS_PRESENT,
                    'justification' => $attendance?->justification ?? '',
                    'recorded_at' => $attendance?->recorded_at?->format('Y-m-d H:i:s'),
                    'absence_count' => $absenceCount,
                    'has_repeated_absences' => $this->attendanceService->hasRepeatedAbsences($absenceCount),
                ];
            })->values()->all(),
        ]);
    }

    public function store(StoreAttendanceRequest $request): RedirectResponse
    {
        $teacher = $request->user();
        $schedule = $this->resolveSchedule(
            $teacher->id,
            $teacher->establishment_id,
            Schedule::query()->findOrFail($request->integer('schedule_id')),
        );
        $now = now();

        $payload = collect($request->validated('students'))
            ->map(fn (array $row) => [
                'establishment_id' => (int) $teacher->establishment_id,
                'schedule_id' => $schedule->id,
                'student_id' => (int) $row['student_id'],
                'teacher_id' => $teacher->id,
                'status' => $row['status'],
                'justification' => in_array($row['status'], [Attendance::STATUS_ABSENT, Attendance::STATUS_LATE], true)
                    ? ($row['justification'] ?: null)
                    : null,
                'recorded_at' => $now,
                'created_at' => $now,
                'updated_at' => $now,
            ])
            ->all();

        DB::transaction(function () use ($payload) {
            Attendance::query()->upsert(
                $payload,
                ['schedule_id', 'student_id'],
                ['establishment_id', 'teacher_id', 'status', 'justification', 'recorded_at', 'updated_at'],
            );
        });

        return redirect()
            ->route('teacher.attendances.edit', $schedule)
            ->with('success', 'Attendance saved successfully.');
    }

    public function history(Request $request): Response
    {
        $teacher = $request->user();
        $filters = [
            'class_id' => (string) $request->string('class_id'),
            'status' => (string) $request->string('status'),
            'student' => trim((string) $request->string('student')),
            'date_from' => (string) $request->string('date_from'),
            'date_to' => (string) $request->string('date_to'),
        ];

        $historyQuery = Attendance::query()
            ->with([
                'schedule.schoolClass:id,name',
                'schedule.subject:id,name',
                'student:id,name',
            ])
            ->forEstablishment((int) $teacher->establishment_id)
            ->forTeacher($teacher->id)
            ->whereHas('schedule', function (Builder $query) use ($teacher, $filters) {
                $query
                    ->where('teacher_id', $teacher->id)
                    ->when($filters['class_id'] !== '', fn (Builder $scheduleQuery) => $scheduleQuery->where('class_id', $filters['class_id']));
            })
            ->when($filters['status'] !== '', fn (Builder $query) => $query->where('status', $filters['status']))
            ->when($filters['student'] !== '', fn (Builder $query) => $query->whereHas('student', fn (Builder $studentQuery) => $studentQuery->where('name', 'like', "%{$filters['student']}%")))
            ->when($filters['date_from'] !== '', fn (Builder $query) => $query->whereDate('recorded_at', '>=', $filters['date_from']))
            ->when($filters['date_to'] !== '', fn (Builder $query) => $query->whereDate('recorded_at', '<=', $filters['date_to']))
            ->latest('recorded_at');

        $summary = [
            'total' => (clone $historyQuery)->count(),
            'absent' => (clone $historyQuery)->where('status', Attendance::STATUS_ABSENT)->count(),
            'late' => (clone $historyQuery)->where('status', Attendance::STATUS_LATE)->count(),
            'present' => (clone $historyQuery)->where('status', Attendance::STATUS_PRESENT)->count(),
        ];

        $attendances = $historyQuery
            ->paginate(15)
            ->withQueryString();

        $absenceCounts = $this->attendanceService->repeatedAbsenceCountsForStudents(
            (int) $teacher->establishment_id,
            $attendances->getCollection()->pluck('student_id')->map(fn ($id) => (int) $id)->unique()->values()->all(),
            $teacher->id,
        );

        $attendances->through(function (Attendance $attendance) use ($absenceCounts) {
            $absenceCount = $absenceCounts[(int) $attendance->student_id] ?? 0;

            return [
                'id' => $attendance->id,
                'student_name' => $attendance->student?->name,
                'class_name' => $attendance->schedule?->schoolClass?->name,
                'subject_name' => $attendance->schedule?->subject?->name,
                'session_label' => sprintf(
                    '%s %s-%s',
                    $attendance->schedule?->day_of_week,
                    substr((string) $attendance->schedule?->start_time, 0, 5),
                    substr((string) $attendance->schedule?->end_time, 0, 5),
                ),
                'status' => $attendance->status,
                'justification' => $attendance->justification,
                'recorded_at' => $attendance->recorded_at?->format('Y-m-d H:i'),
                'absence_count' => $absenceCount,
                'has_repeated_absences' => $this->attendanceService->hasRepeatedAbsences($absenceCount),
            ];
        });

        return Inertia::render('Teacher/Attendances/History', [
            'filters' => $filters,
            'attendances' => $attendances,
            'summary' => $summary,
            'classes' => $this->classOptions($teacher->establishment_id, $teacher->id),
            'statusOptions' => Attendance::STATUS_OPTIONS,
            'repeatedAbsenceThreshold' => AttendanceService::REPEATED_ABSENCE_THRESHOLD,
        ]);
    }

    private function resolveSchedule(int $teacherId, int $establishmentId, Schedule $schedule): Schedule
    {
        abort_unless(
            (int) $schedule->establishment_id === (int) $establishmentId
            && (int) $schedule->teacher_id === (int) $teacherId,
            403,
        );

        return $schedule;
    }

    private function classOptions(int $establishmentId, int $teacherId): array
    {
        return SchoolClass::query()
            ->where('establishment_id', $establishmentId)
            ->whereHas('schedules', fn (Builder $query) => $query->where('teacher_id', $teacherId))
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn (SchoolClass $schoolClass) => [
                'id' => $schoolClass->id,
                'name' => $schoolClass->name,
            ])
            ->all();
    }
}
