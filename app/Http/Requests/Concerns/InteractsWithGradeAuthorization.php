<?php

namespace App\Http\Requests\Concerns;

use App\Models\Evaluation;
use App\Models\StudentProfile;
use App\Models\Term;
use App\Services\EvaluationAccessService;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

trait InteractsWithGradeAuthorization
{
    protected function validateEvaluationAccess(Validator $validator): ?Evaluation
    {
        $user = $this->user();
        $evaluationId = (int) ($this->route('evaluation') instanceof Evaluation
            ? $this->route('evaluation')->id
            : $this->route('evaluation'));

        $evaluation = Evaluation::query()->find($evaluationId);

        if (! $user || ! $evaluation) {
            $validator->errors()->add('evaluation', 'The selected evaluation is invalid.');

            return null;
        }

        $access = app(EvaluationAccessService::class);

        if (! $access->canManageEvaluation($user, $evaluation)) {
            $validator->errors()->add('evaluation', 'You are not allowed to manage grades for this evaluation.');

            return null;
        }

        return $evaluation;
    }

    protected function validateStudentMembership(
        Validator $validator,
        Evaluation $evaluation,
        int $studentId,
        string $field,
    ): void {
        $studentBelongsToEstablishment = StudentProfile::query()
            ->where('user_id', $studentId)
            ->where('establishment_id', $evaluation->establishment_id)
            ->exists();

        if (! $studentBelongsToEstablishment) {
            $validator->errors()->add($field, 'The selected student does not belong to this establishment.');

            return;
        }

        $belongsToClass = false;

        if (Schema::hasTable('class_students')) {
            $belongsToClass = DB::table('class_students')
                ->where('class_id', $evaluation->class_id)
                ->where('student_id', $studentId)
                ->exists();
        }

        if (! $belongsToClass) {
            $belongsToClass = StudentProfile::query()
                ->where('user_id', $studentId)
                ->where('class_id', $evaluation->class_id)
                ->exists();
        }

        if (! $belongsToClass) {
            $validator->errors()->add($field, 'The selected student is not assigned to the evaluation class.');
        }
    }

    protected function validateTermBelongsToEstablishment(Validator $validator, int $termId): void
    {
        if (! Term::query()
            ->where('id', $termId)
            ->where('establishment_id', $this->user()?->establishment_id)
            ->exists()) {
            $validator->errors()->add('term_id', 'The selected term does not belong to your establishment.');
        }
    }
}
