<?php

namespace App\Services;

use App\Models\Schedule;

class ScheduleConflictService
{
    public function detect(
        int $establishmentId,
        int $classId,
        int $teacherId,
        string $dayOfWeek,
        string $startTime,
        string $endTime,
        ?int $ignoreScheduleId = null,
    ): array {
        return [
            'class' => $this->findConflict(
                establishmentId: $establishmentId,
                column: 'class_id',
                ownerId: $classId,
                dayOfWeek: $dayOfWeek,
                startTime: $startTime,
                endTime: $endTime,
                ignoreScheduleId: $ignoreScheduleId,
            ),
            'teacher' => $this->findConflict(
                establishmentId: $establishmentId,
                column: 'teacher_id',
                ownerId: $teacherId,
                dayOfWeek: $dayOfWeek,
                startTime: $startTime,
                endTime: $endTime,
                ignoreScheduleId: $ignoreScheduleId,
            ),
        ];
    }

    private function findConflict(
        int $establishmentId,
        string $column,
        int $ownerId,
        string $dayOfWeek,
        string $startTime,
        string $endTime,
        ?int $ignoreScheduleId = null,
    ): ?Schedule {
        return Schedule::query()
            ->where('establishment_id', $establishmentId)
            ->where($column, $ownerId)
            ->where('day_of_week', $dayOfWeek)
            ->where('start_time', '<', $endTime)
            ->where('end_time', '>', $startTime)
            ->when($ignoreScheduleId, fn ($query) => $query->where('id', '!=', $ignoreScheduleId))
            ->first();
    }
}
