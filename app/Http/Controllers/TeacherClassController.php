<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;

class TeacherClassController extends Controller
{
    public function index(Request $request): Response
    {
        $teacher = $request->user();
        abort_unless($teacher instanceof User && $teacher->hasRole('teacher'), 403);

        $assignments = DB::table('class_subjects')
            ->join('classes', 'classes.id', '=', 'class_subjects.class_id')
            ->join('subjects', 'subjects.id', '=', 'class_subjects.subject_id')
            ->leftJoin('levels', 'levels.id', '=', 'classes.level_id')
            ->leftJoin('academic_years', 'academic_years.id', '=', 'classes.academic_year_id')
            ->where('class_subjects.teacher_id', $teacher->id)
            ->where('classes.establishment_id', $teacher->establishment_id)
            ->where('subjects.establishment_id', $teacher->establishment_id)
            ->orderBy('classes.name')
            ->orderBy('subjects.name')
            ->get([
                'classes.id as class_id',
                'classes.name as class_name',
                'levels.name as level_name',
                'academic_years.name as academic_year_name',
                'subjects.id as subject_id',
                'subjects.name as subject_name',
            ]);

        $studentCounts = $this->studentCounts($teacher->establishment_id);

        $classes = $assignments
            ->groupBy('class_id')
            ->map(function ($rows, $classId) use ($studentCounts) {
                $first = $rows->first();

                return [
                    'id' => (int) $classId,
                    'name' => $first->class_name,
                    'level_name' => $first->level_name,
                    'academic_year_name' => $first->academic_year_name,
                    'student_count' => $studentCounts[(int) $classId] ?? 0,
                    'subjects' => $rows
                        ->map(fn ($row) => [
                            'id' => (int) $row->subject_id,
                            'name' => $row->subject_name,
                        ])
                        ->unique('id')
                        ->values()
                        ->all(),
                ];
            })
            ->values()
            ->all();

        return Inertia::render('Teacher/Classes/Index', [
            'classes' => $classes,
        ]);
    }

    private function studentCounts(int $establishmentId): array
    {
        if (Schema::hasTable('class_students')) {
            return DB::table('class_students')
                ->join('classes', 'classes.id', '=', 'class_students.class_id')
                ->where('classes.establishment_id', $establishmentId)
                ->selectRaw('class_students.class_id, count(*) as total')
                ->groupBy('class_students.class_id')
                ->pluck('total', 'class_students.class_id')
                ->map(fn ($count) => (int) $count)
                ->all();
        }

        return DB::table('student_profiles')
            ->where('establishment_id', $establishmentId)
            ->whereNotNull('class_id')
            ->selectRaw('class_id, count(*) as total')
            ->groupBy('class_id')
            ->pluck('total', 'class_id')
            ->map(fn ($count) => (int) $count)
            ->all();
    }
}
