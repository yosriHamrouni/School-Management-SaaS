<?php

namespace App\Http\Controllers\EstablishmentAdmin;

use App\Http\Controllers\Controller;
use App\Http\Requests\EstablishmentAdmin\StoreScheduleRequest;
use App\Http\Requests\EstablishmentAdmin\UpdateScheduleRequest;
use App\Models\Schedule;
use App\Models\SchoolClass;
use App\Models\Subject;
use App\Models\User;
use App\Services\ScheduleCalendarService;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ScheduleController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = $this->filters($request);

        $schedules = $this->scheduleQuery($request, $filters)
            ->ordered()
            ->paginate(10)
            ->withQueryString()
            ->through(fn (Schedule $schedule) => $this->schedulePayload($schedule));

        return Inertia::render('EstablishmentAdmin/Schedules/Index', [
            'filters' => $filters,
            'schedules' => $schedules,
            'classes' => $this->classOptions($request),
            'subjects' => $this->subjectOptions($request),
            'teachers' => $this->teacherOptions($request),
            'dayOptions' => Schedule::DAY_OPTIONS,
            'calendarFeedUrl' => route('establishment-admin.schedules.feed'),
        ]);
    }

    public function calendarFeed(Request $request, ScheduleCalendarService $calendarService): JsonResponse
    {
        $request->validate([
            'start' => ['required', 'date'],
            'end' => ['required', 'date', 'after:start'],
            'class_id' => ['nullable', 'integer'],
            'teacher_id' => ['nullable', 'integer'],
            'subject_id' => ['nullable', 'integer'],
            'day_of_week' => ['nullable', 'string'],
            'search' => ['nullable', 'string'],
        ]);

        $filters = $this->filters($request);

        $events = $calendarService->buildEvents(
            schedules: $this->scheduleQuery($request, $filters)->ordered()->get(),
            rangeStart: CarbonImmutable::parse((string) $request->string('start')),
            rangeEnd: CarbonImmutable::parse((string) $request->string('end')),
            audience: 'admin',
        );

        return response()->json($events);
    }

    public function create(Request $request): Response
    {
        return Inertia::render('EstablishmentAdmin/Schedules/Create', [
            'classes' => $this->classOptions($request),
            'subjects' => $this->subjectOptions($request),
            'teachers' => $this->teacherOptions($request),
            'dayOptions' => Schedule::DAY_OPTIONS,
        ]);
    }

    public function store(StoreScheduleRequest $request): RedirectResponse
    {
        Schedule::create([
            ...$request->validated(),
            'establishment_id' => $this->establishmentId($request),
            'created_by' => $request->user()->id,
        ]);

        return redirect()
            ->route('establishment-admin.schedules.index')
            ->with('success', 'Schedule created successfully.');
    }

    public function show(Request $request, Schedule $schedule): Response
    {
        $schedule = $this->resolveSchedule($request, $schedule);
        $schedule->load([
            'schoolClass:id,name',
            'subject:id,name',
            'teacher:id,name,email',
            'creator:id,name',
        ]);

        return Inertia::render('EstablishmentAdmin/Schedules/Show', [
            'schedule' => $this->schedulePayload($schedule, true),
        ]);
    }

    public function edit(Request $request, Schedule $schedule): Response
    {
        $schedule = $this->resolveSchedule($request, $schedule);

        return Inertia::render('EstablishmentAdmin/Schedules/Edit', [
            'schedule' => [
                'id' => $schedule->id,
                'class_id' => $schedule->class_id,
                'subject_id' => $schedule->subject_id,
                'teacher_id' => $schedule->teacher_id,
                'day_of_week' => $schedule->day_of_week,
                'start_time' => substr((string) $schedule->start_time, 0, 5),
                'end_time' => substr((string) $schedule->end_time, 0, 5),
            ],
            'classes' => $this->classOptions($request),
            'subjects' => $this->subjectOptions($request),
            'teachers' => $this->teacherOptions($request),
            'dayOptions' => Schedule::DAY_OPTIONS,
        ]);
    }

    public function update(UpdateScheduleRequest $request, Schedule $schedule): RedirectResponse
    {
        $schedule = $this->resolveSchedule($request, $schedule);
        $schedule->update($request->validated());

        return redirect()
            ->route('establishment-admin.schedules.index')
            ->with('success', 'Schedule updated successfully.');
    }

    public function destroy(Request $request, Schedule $schedule): RedirectResponse
    {
        $schedule = $this->resolveSchedule($request, $schedule);

        try {
            $schedule->delete();

            return redirect()
                ->route('establishment-admin.schedules.index')
                ->with('success', 'Schedule deleted successfully.');
        } catch (\Throwable) {
            return redirect()
                ->route('establishment-admin.schedules.index')
                ->with('error', 'Schedule could not be deleted.');
        }
    }

    private function filters(Request $request): array
    {
        return [
            'search' => trim((string) $request->string('search')),
            'class_id' => (string) $request->string('class_id'),
            'teacher_id' => (string) $request->string('teacher_id'),
            'subject_id' => (string) $request->string('subject_id'),
            'day_of_week' => (string) $request->string('day_of_week'),
        ];
    }

    private function scheduleQuery(Request $request, array $filters)
    {
        return Schedule::query()
            ->with([
                'schoolClass:id,name',
                'subject:id,name',
                'teacher:id,name',
            ])
            ->forEstablishment($this->establishmentId($request))
            ->when($filters['class_id'] !== '', fn (Builder $query) => $query->where('class_id', $filters['class_id']))
            ->when($filters['teacher_id'] !== '', fn (Builder $query) => $query->where('teacher_id', $filters['teacher_id']))
            ->when($filters['subject_id'] !== '', fn (Builder $query) => $query->where('subject_id', $filters['subject_id']))
            ->when($filters['day_of_week'] !== '', fn (Builder $query) => $query->where('day_of_week', $filters['day_of_week']))
            ->when($filters['search'] !== '', function (Builder $query) use ($filters) {
                $search = $filters['search'];

                $query->where(function (Builder $subQuery) use ($search) {
                    $subQuery
                        ->where('day_of_week', 'like', "%{$search}%")
                        ->orWhere('start_time', 'like', "%{$search}%")
                        ->orWhere('end_time', 'like', "%{$search}%")
                        ->orWhereHas('schoolClass', fn (Builder $classQuery) => $classQuery->where('name', 'like', "%{$search}%"))
                        ->orWhereHas('subject', fn (Builder $subjectQuery) => $subjectQuery->where('name', 'like', "%{$search}%"))
                        ->orWhereHas('teacher', fn (Builder $teacherQuery) => $teacherQuery->where('name', 'like', "%{$search}%"));
                });
            });
    }

    private function schedulePayload(Schedule $schedule, bool $includeDetails = false): array
    {
        return [
            'id' => $schedule->id,
            'class_name' => $schedule->schoolClass?->name,
            'subject_name' => $schedule->subject?->name,
            'teacher_name' => $schedule->teacher?->name,
            'teacher_email' => $includeDetails ? $schedule->teacher?->email : null,
            'created_by_name' => $includeDetails ? $schedule->creator?->name : null,
            'day_of_week' => $schedule->day_of_week,
            'start_time' => substr((string) $schedule->start_time, 0, 5),
            'end_time' => substr((string) $schedule->end_time, 0, 5),
        ];
    }

    private function resolveSchedule(Request $request, Schedule $schedule): Schedule
    {
        abort_unless(
            $schedule->establishment_id === $this->establishmentId($request),
            403,
        );

        return $schedule;
    }

    private function establishmentId(Request $request): int
    {
        return (int) $request->user()->establishment_id;
    }

    private function classOptions(Request $request)
    {
        return SchoolClass::query()
            ->where('establishment_id', $this->establishmentId($request))
            ->orderBy('name')
            ->get(['id', 'name']);
    }

    private function subjectOptions(Request $request)
    {
        return Subject::query()
            ->where('establishment_id', $this->establishmentId($request))
            ->orderBy('name')
            ->get(['id', 'name']);
    }

    private function teacherOptions(Request $request)
    {
        return User::query()
            ->where('establishment_id', $this->establishmentId($request))
            ->whereHas('roles', fn (Builder $query) => $query->where('name', 'teacher'))
            ->orderBy('name')
            ->get(['id', 'name']);
    }
}
