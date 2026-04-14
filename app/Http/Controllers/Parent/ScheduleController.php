<?php

namespace App\Http\Controllers\Parent;

use App\Http\Controllers\Controller;
use App\Models\Schedule;
use App\Services\ParentStudentAccessService;
use App\Services\ScheduleCalendarService;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ScheduleController extends Controller
{
    public function __construct(
        private readonly ParentStudentAccessService $parentStudentAccessService,
    ) {
    }

    public function index(Request $request, ?int $student = null): Response
    {
        $parent = $request->user();
        $children = $this->parentStudentAccessService->linkedStudents($parent);
        $selectedStudent = $this->parentStudentAccessService->resolveLinkedStudent($parent, $student);

        return Inertia::render('Parent/Schedules/Index', [
            'children' => $children->map(fn ($child) => [
                'id' => $child->user_id,
                'name' => $child->user?->name,
                'student_number' => $child->student_number,
                'class_name' => $child->schoolClass?->name,
            ])->values()->all(),
            'selectedChildId' => $selectedStudent?->user_id,
            'selectedChild' => $selectedStudent ? [
                'id' => $selectedStudent->user_id,
                'name' => $selectedStudent->user?->name,
                'student_number' => $selectedStudent->student_number,
                'class_name' => $selectedStudent->schoolClass?->name,
            ] : null,
            'calendarFeedUrl' => $selectedStudent
                ? route('parent.schedules.feed', ['student' => $selectedStudent->user_id])
                : null,
        ]);
    }

    public function feed(Request $request, int $student, ScheduleCalendarService $calendarService): JsonResponse
    {
        $request->validate([
            'start' => ['required', 'date'],
            'end' => ['required', 'date', 'after:start'],
        ]);

        $parent = $request->user();
        $selectedStudent = $this->parentStudentAccessService->resolveLinkedStudent($parent, $student);
        $classId = $selectedStudent?->class_id;

        if (! $classId) {
            return response()->json([]);
        }

        $events = $calendarService->buildEvents(
            schedules: Schedule::query()
                ->with([
                    'subject:id,name',
                    'teacher:id,name',
                    'schoolClass:id,name',
                ])
                ->forEstablishment((int) $parent->establishment_id)
                ->when($classId, fn (Builder $query) => $query->where('class_id', $classId))
                ->ordered()
                ->get(),
            rangeStart: CarbonImmutable::parse((string) $request->string('start')),
            rangeEnd: CarbonImmutable::parse((string) $request->string('end')),
            audience: 'student',
        );

        return response()->json($events);
    }
}
