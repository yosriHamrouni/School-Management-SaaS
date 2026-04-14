<?php

namespace App\Services;

use App\Models\StudentProfile;
use App\Models\User;
use Illuminate\Support\Collection;

class ParentStudentAccessService
{
    public function linkedStudents(User $parent): Collection
    {
        return StudentProfile::query()
            ->with(['user:id,name', 'schoolClass:id,name'])
            ->where('establishment_id', $parent->establishment_id)
            ->whereHas('parents', fn ($query) => $query->where('users.id', $parent->id))
            ->orderBy('student_number')
            ->orderBy('user_id')
            ->get();
    }

    public function resolveLinkedStudent(User $parent, ?int $studentId): ?StudentProfile
    {
        $students = $this->linkedStudents($parent);

        if ($students->isEmpty()) {
            abort_if($studentId !== null, 403, 'Acces non autorise');

            return null;
        }

        if ($studentId === null) {
            return $students->first();
        }

        $student = $students->firstWhere('user_id', $studentId);
        abort_if($student === null, 403, 'Acces non autorise');

        return $student;
    }
}
