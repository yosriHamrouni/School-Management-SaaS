<?php

namespace App\Http\Requests;

use App\Http\Requests\Concerns\InteractsWithGradeAuthorization;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreGradeRequest extends FormRequest
{
    use InteractsWithGradeAuthorization;

    public function authorize(): bool
    {
        return $this->user() !== null
            && ($this->user()->hasRole('teacher') || $this->user()->hasRole('establishment_admin'));
    }

    public function rules(): array
    {
        return [
            'grades' => ['required', 'array', 'min:1'],
            'grades.*.student_id' => ['required', 'integer'],
            'grades.*.grade' => ['nullable', 'numeric', 'min:0'],
            'grades.*.remarks' => ['nullable', 'string'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $evaluation = $this->validateEvaluationAccess($validator);

            if (! $evaluation) {
                return;
            }

            foreach ($this->input('grades', []) as $index => $row) {
                $studentId = (int) ($row['student_id'] ?? 0);
                $grade = $row['grade'] ?? null;
                $field = "grades.{$index}.student_id";

                $this->validateStudentMembership($validator, $evaluation, $studentId, $field);

                if ($grade !== null && $grade !== '' && (float) $grade > (float) $evaluation->max_grade) {
                    $validator->errors()->add(
                        "grades.{$index}.grade",
                        "The grade may not exceed {$evaluation->max_grade}.",
                    );
                }
            }
        });
    }
}
