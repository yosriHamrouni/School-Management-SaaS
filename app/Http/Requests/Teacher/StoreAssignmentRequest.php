<?php

namespace App\Http\Requests\Teacher;

use App\Models\SchoolClass;
use App\Models\Subject;
use App\Services\AssignmentService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreAssignmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasRole('teacher') ?? false;
    }

    public function rules(): array
    {
        return [
            'class_id' => ['required', 'integer'],
            'subject_id' => ['required', 'integer'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'due_date' => ['required', 'date', 'after_or_equal:today'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $teacher = $this->user();

            if ($teacher === null) {
                return;
            }

            $classId = (int) $this->input('class_id');
            $subjectId = (int) $this->input('subject_id');

            $classExists = SchoolClass::query()
                ->where('id', $classId)
                ->where('establishment_id', $teacher->establishment_id)
                ->exists();

            if (! $classExists) {
                $validator->errors()->add('class_id', 'The selected class does not belong to your establishment.');
            }

            $subjectExists = Subject::query()
                ->where('id', $subjectId)
                ->where('establishment_id', $teacher->establishment_id)
                ->exists();

            if (! $subjectExists) {
                $validator->errors()->add('subject_id', 'The selected subject does not belong to your establishment.');
            }

            $assignmentService = app(AssignmentService::class);

            if (! $assignmentService->activeAcademicYear($teacher)) {
                $validator->errors()->add('class_id', 'No active academic year is configured for your establishment.');
            }

            if (! $assignmentService->canManageClassSubject($teacher, $classId, $subjectId)) {
                $validator->errors()->add(
                    'subject_id',
                    'You can only publish assignments for your own class-subject assignments.',
                );
            }
        });
    }
}
