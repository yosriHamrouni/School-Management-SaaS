<?php

namespace App\Services;

use App\Models\Assignment;
use App\Models\User;
use App\Notifications\AcademicEventNotification;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class AssignmentNotificationService
{
    public function notifyClassStudents(Assignment $assignment): int
    {
        if (! Schema::hasTable('class_students') || ! Schema::hasTable('student_profiles')) {
            return 0;
        }

        $studentUserIds = DB::table('class_students')
            ->join('student_profiles', function ($join) use ($assignment) {
                $join->on('student_profiles.user_id', '=', 'class_students.student_id')
                    ->where('student_profiles.establishment_id', '=', $assignment->establishment_id)
                    ->where('student_profiles.class_id', '=', $assignment->class_id);

                if (Schema::hasColumn('student_profiles', 'deleted_at')) {
                    $join->whereNull('student_profiles.deleted_at');
                }
            })
            ->where('class_students.class_id', $assignment->class_id)
            ->pluck('student_profiles.user_id')
            ->unique()
            ->values();

        if ($studentUserIds->isEmpty()) {
            return 0;
        }

        $students = User::query()
            ->whereIn('id', $studentUserIds)
            ->get();

        $students->each->notify(new AcademicEventNotification(
            title: "New assignment: {$assignment->title}",
            body: "A new assignment has been published for your class. Due date: {$assignment->due_date?->format('Y-m-d')}.",
            category: 'assignment',
            actionUrl: route('student.assignments.index'),
            metadata: [
                'assignment_id' => $assignment->id,
                'establishment_id' => $assignment->establishment_id,
            ],
        ));

        return $students->count();
    }
}
