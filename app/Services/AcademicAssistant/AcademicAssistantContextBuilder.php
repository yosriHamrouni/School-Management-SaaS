<?php

namespace App\Services\AcademicAssistant;

use App\Models\Attendance;
use App\Models\SchoolClass;
use App\Models\StudentProfile;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class AcademicAssistantContextBuilder
{
    public function build(User $user): array
    {
        $relations = ['roles'];

        if (Schema::hasTable('student_profiles')) {
            $relations[] = 'studentProfile';
        }

        if (Schema::hasTable('student_profiles') && Schema::hasTable('student_parent')) {
            $relations[] = 'children';
        }

        $user->loadMissing($relations);

        $establishmentId = $user->establishment_id ? (int) $user->establishment_id : null;
        if ($establishmentId === null) {
            return $this->emptyContext('none', null);
        }

        $scope = $this->resolveScope($user, $establishmentId);

        return [
            'scope' => $scope['name'],
            'establishment_id' => $establishmentId,
            'user' => [
                'role_scope' => $scope['name'],
            ],
            'classes' => ['count' => $this->classesCount($establishmentId, $scope['class_ids'])],
            'students' => ['count' => $this->studentsCount($establishmentId, $scope['student_user_ids'], $scope['student_profile_ids'])],
            'grades' => $this->gradeStats($establishmentId, $scope['class_ids'], $scope['subject_ids'], $scope['student_user_ids']),
            'attendance' => $this->attendanceStats($establishmentId, $scope['student_user_ids'], $scope['teacher_id']),
            'risk' => $this->riskStats($establishmentId, $scope['student_profile_ids']),
        ];
    }

    private function resolveScope(User $user, int $establishmentId): array
    {
        if ($user->hasRole('teacher')) {
            if (! Schema::hasTable('class_subjects') || ! Schema::hasTable('classes')) {
                return $this->scopedEmpty('teacher', (int) $user->id);
            }

            $assignments = DB::table('class_subjects')
                ->join('classes', 'classes.id', '=', 'class_subjects.class_id')
                ->where('classes.establishment_id', $establishmentId)
                ->where('class_subjects.teacher_id', $user->id)
                ->select('class_subjects.class_id', 'class_subjects.subject_id')
                ->get();

            $classIds = $assignments->pluck('class_id')->unique()->map(fn ($id) => (int) $id)->values()->all();
            $subjectIds = $assignments->pluck('subject_id')->unique()->map(fn ($id) => (int) $id)->values()->all();
            $studentUserIds = [];

            if (Schema::hasTable('class_students')) {
                $studentUserIds = DB::table('class_students')
                    ->join('users', 'users.id', '=', 'class_students.student_id')
                    ->whereIn('class_students.class_id', $classIds ?: [0])
                    ->where('users.establishment_id', $establishmentId)
                    ->distinct()
                    ->pluck('class_students.student_id')
                    ->map(fn ($id) => (int) $id)
                    ->values()
                    ->all();
            }

            $studentProfileIds = [];

            if (Schema::hasTable('student_profiles')) {
                $studentProfileIds = StudentProfile::query()
                    ->where('establishment_id', $establishmentId)
                    ->whereIn('user_id', $studentUserIds ?: [0])
                    ->pluck('id')
                    ->map(fn ($id) => (int) $id)
                    ->all();
            }

            return [
                'name' => 'teacher',
                'class_ids' => $classIds,
                'subject_ids' => $subjectIds,
                'student_user_ids' => $studentUserIds,
                'student_profile_ids' => $studentProfileIds,
                'teacher_id' => (int) $user->id,
            ];
        }

        if ($user->hasRole('parent')) {
            if (! Schema::hasTable('student_profiles') || ! Schema::hasTable('student_parent')) {
                return $this->scopedEmpty('parent');
            }

            $children = $user->children->where('establishment_id', $establishmentId)->values();

            return [
                'name' => 'parent',
                'class_ids' => $children->pluck('class_id')->filter()->unique()->map(fn ($id) => (int) $id)->values()->all(),
                'subject_ids' => null,
                'student_user_ids' => $children->pluck('user_id')->filter()->unique()->map(fn ($id) => (int) $id)->values()->all(),
                'student_profile_ids' => $children->pluck('id')->unique()->map(fn ($id) => (int) $id)->values()->all(),
                'teacher_id' => null,
            ];
        }

        if ($user->hasRole('student')) {
            if (! Schema::hasTable('student_profiles')) {
                return [
                    'name' => 'student',
                    'class_ids' => [],
                    'subject_ids' => null,
                    'student_user_ids' => [(int) $user->id],
                    'student_profile_ids' => [],
                    'teacher_id' => null,
                ];
            }

            $profile = $user->studentProfile;
            $hasProfile = $profile && (int) $profile->establishment_id === $establishmentId;

            return [
                'name' => 'student',
                'class_ids' => $hasProfile && $profile->class_id ? [(int) $profile->class_id] : [],
                'subject_ids' => null,
                'student_user_ids' => [(int) $user->id],
                'student_profile_ids' => $hasProfile ? [(int) $profile->id] : [],
                'teacher_id' => null,
            ];
        }

        return [
            'name' => $user->hasRole('establishment_admin') || $user->hasRole('admin') ? 'establishment_admin' : 'establishment_user',
            'class_ids' => null,
            'subject_ids' => null,
            'student_user_ids' => null,
            'student_profile_ids' => null,
            'teacher_id' => null,
        ];
    }

    private function classesCount(int $establishmentId, ?array $classIds): int
    {
        if (! Schema::hasTable('classes')) {
            return 0;
        }

        $query = SchoolClass::query()->where('establishment_id', $establishmentId);

        if ($classIds !== null) {
            $query->whereIn('id', $classIds ?: [0]);
        }

        return $query->count();
    }

    private function studentsCount(int $establishmentId, ?array $studentUserIds, ?array $studentProfileIds): int
    {
        if (! Schema::hasTable('student_profiles')) {
            return 0;
        }

        $query = StudentProfile::query()->where('establishment_id', $establishmentId);

        if ($studentProfileIds !== null) {
            $query->whereIn('id', $studentProfileIds ?: [0]);
        } elseif ($studentUserIds !== null) {
            $query->whereIn('user_id', $studentUserIds ?: [0]);
        }

        return $query->distinct('user_id')->count('user_id');
    }

    private function gradeStats(int $establishmentId, ?array $classIds, ?array $subjectIds, ?array $studentUserIds): array
    {
        if (! Schema::hasTable('grades') || ! Schema::hasTable('evaluations')) {
            return ['available' => false, 'count' => 0, 'average' => null, 'min' => null, 'max' => null];
        }

        $query = DB::table('grades')
            ->join('evaluations', 'evaluations.id', '=', 'grades.evaluation_id')
            ->where('evaluations.establishment_id', $establishmentId);

        if (Schema::hasColumn('evaluations', 'deleted_at')) {
            $query->whereNull('evaluations.deleted_at');
        }

        if ($classIds !== null) {
            $query->whereIn('evaluations.class_id', $classIds ?: [0]);
        }

        if ($subjectIds !== null) {
            $query->whereIn('evaluations.subject_id', $subjectIds ?: [0]);
        }

        if ($studentUserIds !== null) {
            $query->whereIn('grades.student_id', $studentUserIds ?: [0]);
        }

        $stats = $query
            ->selectRaw('count(grades.id) as grade_count')
            ->selectRaw('round(avg(grades.grade), 2) as average_grade')
            ->selectRaw('round(min(grades.grade), 2) as min_grade')
            ->selectRaw('round(max(grades.grade), 2) as max_grade')
            ->first();

        return [
            'available' => (int) ($stats->grade_count ?? 0) > 0,
            'count' => (int) ($stats->grade_count ?? 0),
            'average' => $stats->average_grade !== null ? (float) $stats->average_grade : null,
            'min' => $stats->min_grade !== null ? (float) $stats->min_grade : null,
            'max' => $stats->max_grade !== null ? (float) $stats->max_grade : null,
        ];
    }

    private function attendanceStats(int $establishmentId, ?array $studentUserIds, ?int $teacherId): array
    {
        if (! Schema::hasTable('attendances')) {
            return ['absences' => 0, 'late' => 0, 'records' => 0];
        }

        $query = DB::table('attendances')->where('establishment_id', $establishmentId);

        if ($studentUserIds !== null) {
            $query->whereIn('student_id', $studentUserIds ?: [0]);
        }

        if ($teacherId !== null) {
            $query->where('teacher_id', $teacherId);
        }

        $rows = $query
            ->select('status', DB::raw('count(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status');

        return [
            'absences' => (int) ($rows[Attendance::STATUS_ABSENT] ?? 0),
            'late' => (int) ($rows[Attendance::STATUS_LATE] ?? 0),
            'records' => (int) $rows->sum(),
        ];
    }

    private function riskStats(int $establishmentId, ?array $studentProfileIds): array
    {
        if (! Schema::hasTable('student_risk_predictions')) {
            return ['available' => false, 'total' => 0, 'high' => 0, 'medium' => 0];
        }

        $query = DB::table('student_risk_predictions')->where('establishment_id', $establishmentId);

        if ($studentProfileIds !== null) {
            $query->whereIn('student_id', $studentProfileIds ?: [0]);
        }

        $rows = $query
            ->select('risk_level', DB::raw('count(*) as total'))
            ->groupBy('risk_level')
            ->pluck('total', 'risk_level');

        return [
            'available' => $rows->isNotEmpty(),
            'total' => (int) $rows->sum(),
            'high' => $this->sumMatching($rows, ['high', 'eleve', 'haut']),
            'medium' => $this->sumMatching($rows, ['medium', 'moyen']),
        ];
    }

    private function sumMatching(Collection $rows, array $needles): int
    {
        return (int) $rows->filter(function (int $total, string $level) use ($needles) {
            $normalized = Str::ascii(Str::lower($level));

            foreach ($needles as $needle) {
                if (str_contains($normalized, Str::ascii(Str::lower($needle)))) {
                    return true;
                }
            }

            return false;
        })->sum();
    }

    private function emptyContext(string $scope, ?int $establishmentId): array
    {
        return [
            'scope' => $scope,
            'establishment_id' => $establishmentId,
            'user' => [
                'role_scope' => $scope,
            ],
            'classes' => ['count' => 0],
            'students' => ['count' => 0],
            'grades' => ['available' => false, 'count' => 0, 'average' => null, 'min' => null, 'max' => null],
            'attendance' => ['absences' => 0, 'late' => 0, 'records' => 0],
            'risk' => ['available' => false, 'total' => 0, 'high' => 0, 'medium' => 0],
        ];
    }

    private function scopedEmpty(string $scope, ?int $teacherId = null): array
    {
        return [
            'name' => $scope,
            'class_ids' => [],
            'subject_ids' => [],
            'student_user_ids' => [],
            'student_profile_ids' => [],
            'teacher_id' => $teacherId,
        ];
    }
}
