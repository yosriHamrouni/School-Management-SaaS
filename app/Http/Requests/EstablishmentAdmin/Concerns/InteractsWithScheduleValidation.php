<?php

namespace App\Http\Requests\EstablishmentAdmin\Concerns;

use App\Models\Schedule;
use App\Models\SchoolClass;
use App\Models\Subject;
use App\Models\User;
use App\Services\ScheduleConflictService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

trait InteractsWithScheduleValidation
{
    protected function scheduleRules(): array
    {
        return [
            'class_id' => ['required', 'integer', 'exists:classes,id'],
            'subject_id' => ['required', 'integer', 'exists:subjects,id'],
            'teacher_id' => ['required', 'integer', 'exists:users,id'],
            'day_of_week' => ['required', 'string', Rule::in(Schedule::DAY_OPTIONS)],
            'start_time' => ['required', 'date_format:H:i'],
            'end_time' => ['required', 'date_format:H:i', 'after:start_time'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            $establishmentId = (int) $this->user()->establishment_id;
            $classId = (int) $this->input('class_id');
            $subjectId = (int) $this->input('subject_id');
            $teacherId = (int) $this->input('teacher_id');

            $schoolClass = SchoolClass::query()
                ->where('id', $classId)
                ->where('establishment_id', $establishmentId)
                ->first();

            if (! $schoolClass) {
                $validator->errors()->add('class_id', 'The selected class is invalid.');
            }

            $subject = Subject::query()
                ->where('id', $subjectId)
                ->where('establishment_id', $establishmentId)
                ->first();

            if (! $subject) {
                $validator->errors()->add('subject_id', 'The selected subject is invalid.');
            }

            $teacher = User::query()
                ->where('id', $teacherId)
                ->where('establishment_id', $establishmentId)
                ->whereHas('roles', fn (Builder $query) => $query->where('name', 'teacher'))
                ->first();

            if (! $teacher) {
                $validator->errors()->add('teacher_id', 'The selected teacher is invalid.');
            }

            if ($validator->errors()->hasAny(['class_id', 'teacher_id', 'day_of_week', 'start_time', 'end_time'])) {
                return;
            }

            $conflicts = app(ScheduleConflictService::class)->detect(
                establishmentId: $establishmentId,
                classId: $classId,
                teacherId: $teacherId,
                dayOfWeek: (string) $this->input('day_of_week'),
                startTime: (string) $this->input('start_time'),
                endTime: (string) $this->input('end_time'),
                ignoreScheduleId: $this->scheduleId(),
            );

            if ($conflicts['class']) {
                $validator->errors()->add('class_id', 'This class already has a schedule during this time slot.');
            }

            if ($conflicts['teacher']) {
                $validator->errors()->add('teacher_id', 'This teacher already has a schedule during this time slot.');
            }
        });
    }

    protected function scheduleId(): ?int
    {
        $schedule = $this->route('schedule');

        if ($schedule instanceof Schedule) {
            return (int) $schedule->id;
        }

        return $schedule ? (int) $schedule : null;
    }
}
