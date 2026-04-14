<?php

namespace App\Services;

use App\Models\AcademicYear;
use App\Models\Assignment;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class AssignmentService
{
    public function visibleAssignmentsQuery(User $teacher): Builder
    {
        return Assignment::query()
            ->where('establishment_id', $teacher->establishment_id)
            ->whereExists(function ($subQuery) use ($teacher) {
                $subQuery
                    ->selectRaw('1')
                    ->from('class_subjects')
                    ->whereColumn('class_subjects.class_id', 'assignments.class_id')
                    ->whereColumn('class_subjects.subject_id', 'assignments.subject_id')
                    ->where('class_subjects.teacher_id', $teacher->id);
            });
    }

    public function visibleAssignmentsForStudentQuery(User $student): Builder
    {
        $query = Assignment::query()
            ->where('establishment_id', $student->establishment_id);

        if (Schema::hasTable('class_students')) {
            return $query->whereExists(function ($subQuery) use ($student) {
                $subQuery
                    ->selectRaw('1')
                    ->from('class_students')
                    ->whereColumn('class_students.class_id', 'assignments.class_id')
                    ->where('class_students.student_id', $student->id);
            });
        }

        $classId = $student->loadMissing('studentProfile')->studentProfile?->class_id;

        return $query->when($classId, fn (Builder $assignmentQuery) => $assignmentQuery->where('class_id', $classId))
            ->when(! $classId, fn (Builder $assignmentQuery) => $assignmentQuery->whereRaw('1 = 0'));
    }

    public function canManageAssignment(User $teacher, Assignment $assignment): bool
    {
        return $this->visibleAssignmentsQuery($teacher)
            ->whereKey($assignment->id)
            ->exists();
    }

    public function canStudentViewAssignment(User $student, Assignment $assignment): bool
    {
        return $this->visibleAssignmentsForStudentQuery($student)
            ->whereKey($assignment->id)
            ->exists();
    }

    public function canManageClassSubject(User $teacher, int $classId, int $subjectId): bool
    {
        return DB::table('class_subjects')
            ->join('classes', 'classes.id', '=', 'class_subjects.class_id')
            ->join('subjects', 'subjects.id', '=', 'class_subjects.subject_id')
            ->where('class_subjects.class_id', $classId)
            ->where('class_subjects.subject_id', $subjectId)
            ->where('class_subjects.teacher_id', $teacher->id)
            ->where('classes.establishment_id', $teacher->establishment_id)
            ->where('subjects.establishment_id', $teacher->establishment_id)
            ->exists();
    }

    public function assignmentOptions(User $teacher): array
    {
        return DB::table('class_subjects')
            ->join('classes', 'classes.id', '=', 'class_subjects.class_id')
            ->join('subjects', 'subjects.id', '=', 'class_subjects.subject_id')
            ->where('class_subjects.teacher_id', $teacher->id)
            ->where('classes.establishment_id', $teacher->establishment_id)
            ->where('subjects.establishment_id', $teacher->establishment_id)
            ->orderBy('classes.name')
            ->orderBy('subjects.name')
            ->get([
                'class_subjects.class_id',
                'class_subjects.subject_id',
                'classes.name as class_name',
                'subjects.name as subject_name',
            ])
            ->map(fn ($assignment) => [
                'class_id' => (int) $assignment->class_id,
                'subject_id' => (int) $assignment->subject_id,
                'label' => "{$assignment->class_name} - {$assignment->subject_name}",
            ])
            ->values()
            ->all();
    }

    public function activeAcademicYear(User $teacher): ?AcademicYear
    {
        return AcademicYear::query()
            ->where('establishment_id', $teacher->establishment_id)
            ->where(function (Builder $query) {
                $query
                    ->where('is_current', true)
                    ->orWhere('status', 'active');
            })
            ->orderByDesc('is_current')
            ->orderByDesc('id')
            ->first();
    }
}
