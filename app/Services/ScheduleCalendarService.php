<?php

namespace App\Services;

use App\Models\Schedule;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;

class ScheduleCalendarService
{
    public function buildEvents(Collection $schedules, CarbonImmutable $rangeStart, CarbonImmutable $rangeEnd, string $audience = 'admin'): array
    {
        $events = [];

        foreach ($schedules as $schedule) {
            foreach ($this->occurrencesForDay($schedule->day_of_week, $rangeStart, $rangeEnd) as $date) {
                $events[] = [
                    'id' => (string) $schedule->id,
                    'title' => $this->eventTitle($schedule, $audience),
                    'start' => $date->format('Y-m-d').'T'.substr((string) $schedule->start_time, 0, 8),
                    'end' => $date->format('Y-m-d').'T'.substr((string) $schedule->end_time, 0, 8),
                    'extendedProps' => [
                        'schedule_id' => $schedule->id,
                        'day_of_week' => $schedule->day_of_week,
                        'start_time' => substr((string) $schedule->start_time, 0, 5),
                        'end_time' => substr((string) $schedule->end_time, 0, 5),
                        'class_id' => $schedule->class_id,
                        'class_name' => $schedule->schoolClass?->name,
                        'subject_id' => $schedule->subject_id,
                        'subject_name' => $schedule->subject?->name,
                        'teacher_id' => $schedule->teacher_id,
                        'teacher_name' => $schedule->teacher?->name,
                    ],
                ];
            }
        }

        return $events;
    }

    private function eventTitle(Schedule $schedule, string $audience): string
    {
        return match ($audience) {
            'student' => trim(sprintf('%s - %s', $schedule->subject?->name, $schedule->teacher?->name)),
            'teacher' => trim(sprintf('%s - %s', $schedule->subject?->name, $schedule->schoolClass?->name)),
            default => trim(sprintf('%s - %s', $schedule->subject?->name, $schedule->schoolClass?->name)),
        };
    }

    private function occurrencesForDay(string $dayOfWeek, CarbonImmutable $rangeStart, CarbonImmutable $rangeEnd): array
    {
        $occurrences = [];
        $cursor = $rangeStart->startOfDay();
        $end = $rangeEnd->startOfDay();

        while ($cursor->lt($end)) {
            if (strcasecmp($cursor->englishDayOfWeek, $dayOfWeek) === 0) {
                $occurrences[] = $cursor;
            }

            $cursor = $cursor->addDay();
        }

        return $occurrences;
    }
}
