<?php

namespace App\Services;

use App\Models\Evaluation;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class EvaluationAccessService
{
    public function visibleEvaluationsQuery(User $user): Builder
    {
        $query = Evaluation::query()
            ->where('establishment_id', $user->establishment_id);

        if ($user->hasRole('establishment_admin')) {
            return $query;
        }

        return $query->whereExists(function ($subQuery) use ($user) {
            $subQuery
                ->selectRaw('1')
                ->from('class_subjects')
                ->whereColumn('class_subjects.class_id', 'evaluations.class_id')
                ->whereColumn('class_subjects.subject_id', 'evaluations.subject_id')
                ->where('class_subjects.teacher_id', $user->id);
        });
    }

    public function canManageClassSubject(
        User $user,
        int $classId,
        int $subjectId,
        int $establishmentId,
    ): bool {
        if ((int) $user->establishment_id !== $establishmentId) {
            return false;
        }

        if ($user->hasRole('establishment_admin')) {
            return DB::table('class_subjects')
                ->join('classes', 'classes.id', '=', 'class_subjects.class_id')
                ->join('subjects', 'subjects.id', '=', 'class_subjects.subject_id')
                ->where('class_subjects.class_id', $classId)
                ->where('class_subjects.subject_id', $subjectId)
                ->where('classes.establishment_id', $establishmentId)
                ->where('subjects.establishment_id', $establishmentId)
                ->exists();
        }

        return DB::table('class_subjects')
            ->join('classes', 'classes.id', '=', 'class_subjects.class_id')
            ->join('subjects', 'subjects.id', '=', 'class_subjects.subject_id')
            ->where('class_subjects.class_id', $classId)
            ->where('class_subjects.subject_id', $subjectId)
            ->where('class_subjects.teacher_id', $user->id)
            ->where('classes.establishment_id', $establishmentId)
            ->where('subjects.establishment_id', $establishmentId)
            ->exists();
    }

    public function canManageEvaluation(User $user, Evaluation $evaluation): bool
    {
        return $this->visibleEvaluationsQuery($user)
            ->whereKey($evaluation->id)
            ->exists();
    }

    public function canAccessStudent(User $user, int $studentId): bool
    {
        if ($user->hasRole('establishment_admin')) {
            return DB::table('users')
                ->where('id', $studentId)
                ->where('establishment_id', $user->establishment_id)
                ->exists();
        }

        $classQuery = DB::table('student_profiles')
            ->where('user_id', $studentId)
            ->where('establishment_id', $user->establishment_id);

        if (Schema::hasTable('class_students')) {
            return DB::table('class_students')
                ->join('class_subjects', 'class_subjects.class_id', '=', 'class_students.class_id')
                ->join('users', 'users.id', '=', 'class_students.student_id')
                ->where('class_students.student_id', $studentId)
                ->where('class_subjects.teacher_id', $user->id)
                ->where('users.establishment_id', $user->establishment_id)
                ->exists();
        }

        $classId = $classQuery->value('class_id');

        if ($classId === null) {
            return false;
        }

        return DB::table('class_subjects')
            ->join('classes', 'classes.id', '=', 'class_subjects.class_id')
            ->where('class_subjects.class_id', $classId)
            ->where('class_subjects.teacher_id', $user->id)
            ->where('classes.establishment_id', $user->establishment_id)
            ->exists();
    }

    public function assignmentOptions(User $user): array
    {
        return DB::table('class_subjects')
            ->join('classes', 'classes.id', '=', 'class_subjects.class_id')
            ->join('subjects', 'subjects.id', '=', 'class_subjects.subject_id')
            ->join('users as teachers', 'teachers.id', '=', 'class_subjects.teacher_id')
            ->where('classes.establishment_id', $user->establishment_id)
            ->where('subjects.establishment_id', $user->establishment_id)
            ->when(
                ! $user->hasRole('establishment_admin'),
                fn ($query) => $query->where('class_subjects.teacher_id', $user->id),
            )
            ->orderBy('classes.name')
            ->orderBy('subjects.name')
            ->get([
                'class_subjects.class_id',
                'class_subjects.subject_id',
                'class_subjects.teacher_id',
                'classes.name as class_name',
                'subjects.name as subject_name',
                'teachers.name as teacher_name',
            ])
            ->map(fn ($assignment) => [
                'class_id' => (int) $assignment->class_id,
                'subject_id' => (int) $assignment->subject_id,
                'teacher_id' => (int) $assignment->teacher_id,
                'label' => "{$assignment->class_name} - {$assignment->subject_name} ({$assignment->teacher_name})",
            ])
            ->values()
            ->all();
    }
}
