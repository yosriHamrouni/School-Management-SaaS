<?php

namespace App\Http\Requests;

use App\Http\Requests\Concerns\InteractsWithGradeAuthorization;
use App\Models\Grade;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class UpdateGradeRequest extends FormRequest
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
            'grade' => ['required', 'numeric', 'min:0'],
            'remarks' => ['nullable', 'string'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $evaluation = $this->validateEvaluationAccess($validator);
            $grade = $this->route('grade');

            if (! $evaluation || ! $grade instanceof Grade) {
                $validator->errors()->add('grade', 'The selected grade is invalid.');

                return;
            }

            if ($grade->evaluation_id !== $evaluation->id) {
                $validator->errors()->add('grade', 'The selected grade does not belong to this evaluation.');
            }

            $this->validateStudentMembership($validator, $evaluation, (int) $grade->student_id, 'grade');

            if ((float) $this->input('grade') > (float) $evaluation->max_grade) {
                $validator->errors()->add('grade', "The grade may not exceed {$evaluation->max_grade}.");
            }
        });
    }
}
