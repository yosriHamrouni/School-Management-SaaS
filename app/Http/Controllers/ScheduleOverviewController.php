<?php

namespace App\Http\Controllers;

use App\Models\Schedule;
use App\Services\ScheduleCalendarService;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ScheduleOverviewController extends Controller
{
    public function teacherIndex(Request $request): Response
    {
        return Inertia::render('Teacher/Schedules/Index', [
            'calendarFeedUrl' => route('teacher.schedules.feed'),
        ]);
    }

    public function teacherFeed(Request $request, ScheduleCalendarService $calendarService): JsonResponse
    {
        $request->validate([
            'start' => ['required', 'date'],
            'end' => ['required', 'date', 'after:start'],
        ]);

        $teacher = $request->user();

        $events = $calendarService->buildEvents(
            schedules: Schedule::query()
                ->with(['schoolClass:id,name', 'subject:id,name'])
                ->forEstablishment((int) $teacher->establishment_id)
                ->where('teacher_id', $teacher->id)
                ->ordered()
                ->get(),
            rangeStart: CarbonImmutable::parse((string) $request->string('start')),
            rangeEnd: CarbonImmutable::parse((string) $request->string('end')),
            audience: 'teacher',
        );

        return response()->json($events);
    }

    public function studentIndex(Request $request): Response
    {
        return Inertia::render('Student/Schedules/Index', [
            'calendarFeedUrl' => route('student.schedules.feed'),
            'className' => $request->user()->load('studentProfile.schoolClass')->studentProfile?->schoolClass?->name,
        ]);
    }

    public function studentFeed(Request $request, ScheduleCalendarService $calendarService): JsonResponse
    {
        $request->validate([
            'start' => ['required', 'date'],
            'end' => ['required', 'date', 'after:start'],
        ]);

        $student = $request->user()->load('studentProfile');
        $classId = $student->studentProfile?->class_id;

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
                ->forEstablishment((int) $student->establishment_id)
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
