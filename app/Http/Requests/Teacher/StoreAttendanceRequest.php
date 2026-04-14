<?php

namespace App\Http\Requests\Teacher;

use App\Models\Attendance;
use App\Models\Schedule;
use App\Services\AttendanceService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreAttendanceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasRole('teacher') ?? false;
    }

    public function rules(): array
    {
        return [
            'schedule_id' => ['required', 'integer', 'exists:schedules,id'],
            'students' => ['required', 'array', 'min:1'],
            'students.*.student_id' => ['required', 'integer', 'distinct:strict'],
            'students.*.status' => ['required', 'string', Rule::in(Attendance::STATUS_OPTIONS)],
            'students.*.justification' => ['nullable', 'string', 'max:1000'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $user = $this->user();

            if ($user === null) {
                return;
            }

            $schedule = Schedule::query()
                ->whereKey($this->integer('schedule_id'))
                ->where('establishment_id', $user->establishment_id)
                ->first();

            if (! $schedule) {
                $validator->errors()->add('schedule_id', 'The selected session is invalid.');

                return;
            }

            if ((int) $schedule->teacher_id !== (int) $user->id) {
                $validator->errors()->add('schedule_id', 'You can only record attendance for your own sessions.');

                return;
            }

            $validStudentIds = app(AttendanceService::class)->validStudentIdsForSchedule($schedule);
            $rows = collect($this->input('students', []));

            $rows->each(function (mixed $row, int $index) use ($validStudentIds, $validator) {
                if (! is_array($row)) {
                    return;
                }

                $studentId = (int) ($row['student_id'] ?? 0);
                $status = (string) ($row['status'] ?? '');
                $justification = trim((string) ($row['justification'] ?? ''));

                if (! in_array($studentId, $validStudentIds, true)) {
                    $validator->errors()->add(
                        "students.{$index}.student_id",
                        'The selected student does not belong to this class.',
                    );
                }

                if (
                    $status === Attendance::STATUS_PRESENT
                    && $justification !== ''
                ) {
                    $validator->errors()->add(
                        "students.{$index}.justification",
                        'A justification can only be added for an absence or a late arrival.',
                    );
                }
            });
        });
    }
}
