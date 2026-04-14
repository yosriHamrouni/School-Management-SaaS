<?php

namespace App\Http\Requests;

use App\Http\Requests\Concerns\InteractsWithGradeAuthorization;
use App\Models\SchoolClass;
use App\Models\Subject;
use App\Services\EvaluationAccessService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreEvaluationRequest extends FormRequest
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
            'title' => ['required', 'string', 'max:255'],
            'class_id' => ['required', 'integer'],
            'subject_id' => ['required', 'integer'],
            'term_id' => ['required', 'integer'],
            'type' => ['required', 'string', 'max:100'],
            'coefficient' => ['required', 'numeric', 'gt:0'],
            'max_grade' => ['required', 'numeric', 'gt:0'],
            'evaluation_date' => ['required', 'date'],
            'description' => ['nullable', 'string'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $classId = (int) $this->input('class_id');
            $subjectId = (int) $this->input('subject_id');
            $termId = (int) $this->input('term_id');
            $establishmentId = (int) $this->user()->establishment_id;

            $class = SchoolClass::query()
                ->where('id', $classId)
                ->where('establishment_id', $establishmentId)
                ->exists();

            if (! $class) {
                $validator->errors()->add('class_id', 'The selected class does not belong to your establishment.');
            }

            $subject = Subject::query()
                ->where('id', $subjectId)
                ->where('establishment_id', $establishmentId)
                ->exists();

            if (! $subject) {
                $validator->errors()->add('subject_id', 'The selected subject does not belong to your establishment.');
            }

            $this->validateTermBelongsToEstablishment($validator, $termId);

            $access = app(EvaluationAccessService::class);

            if (! $access->canManageClassSubject(
                $this->user(),
                $classId,
                $subjectId,
                $establishmentId,
            )) {
                $validator->errors()->add(
                    'subject_id',
                    'You are not allowed to manage evaluations for this class and subject.',
                );
            }
        });
    }
}
