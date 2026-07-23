<?php

namespace Database\Seeders;

use App\Models\AcademicYear;
use App\Models\Assignment;
use App\Models\ClassSubject;
use App\Models\SchoolClass;
use App\Models\Subject;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Schema;

class AssignmentDemoSeeder extends Seeder
{
    public function run(): void
    {
        if (! Schema::hasTable('assignments') || ! Schema::hasTable('class_subjects')) {
            return;
        }

        $teacher = User::query()
            ->where('email', 'teacher@school-management.test')
            ->first();

        if (! $teacher || ! $teacher->establishment_id) {
            return;
        }

        $establishmentId = (int) $teacher->establishment_id;

        $academicYear = AcademicYear::query()
            ->where('establishment_id', $establishmentId)
            ->where(function ($query) {
                $query
                    ->where('is_current', true)
                    ->orWhere('status', 'active');
            })
            ->orderByDesc('is_current')
            ->orderByDesc('id')
            ->first();

        if (! $academicYear) {
            return;
        }

        $computerScience = Subject::query()
            ->where('establishment_id', $establishmentId)
            ->where('name', 'Computer Science')
            ->first();

        if (! $computerScience) {
            return;
        }

        foreach ($this->assignments() as $assignmentData) {
            $class = SchoolClass::query()
                ->where('establishment_id', $establishmentId)
                ->where('name', $assignmentData['class'])
                ->first();

            if (! $class) {
                continue;
            }

            ClassSubject::query()->updateOrCreate(
                [
                    'class_id' => $class->id,
                    'subject_id' => $computerScience->id,
                    'teacher_id' => $teacher->id,
                ],
                [],
            );

            Assignment::query()->updateOrCreate(
                [
                    'establishment_id' => $establishmentId,
                    'academic_year_id' => $academicYear->id,
                    'class_id' => $class->id,
                    'subject_id' => $computerScience->id,
                    'title' => $assignmentData['title'],
                ],
                [
                    'description' => $assignmentData['description'],
                    'due_date' => now()->addDays($assignmentData['due_in_days'])->toDateString(),
                ],
            );
        }
    }

    /**
     * @return array<int, array{class: string, title: string, description: string, due_in_days: int}>
     */
    private function assignments(): array
    {
        return [
            [
                'class' => 'Primary A',
                'title' => 'Algorithm Basics Worksheet',
                'description' => 'Complete the flowchart exercises and identify the input, process, and output for each problem.',
                'due_in_days' => 3,
            ],
            [
                'class' => 'Primary A',
                'title' => 'Digital Safety Poster',
                'description' => 'Create a one-page poster with five rules for staying safe online.',
                'due_in_days' => 10,
            ],
            [
                'class' => 'Primary B',
                'title' => 'Scratch Animation Practice',
                'description' => 'Build a short Scratch scene using at least two sprites, one loop, and one conditional block.',
                'due_in_days' => 5,
            ],
            [
                'class' => 'Primary B',
                'title' => 'Keyboard Shortcuts Revision',
                'description' => 'Revise the shortcut list and answer the practice questions in the workbook.',
                'due_in_days' => -2,
            ],
            [
                'class' => 'Middle 1',
                'title' => 'HTML Profile Page',
                'description' => 'Create a simple HTML profile page with headings, paragraphs, links, and an image placeholder.',
                'due_in_days' => 7,
            ],
            [
                'class' => 'Middle 1',
                'title' => 'Spreadsheet Formulas Drill',
                'description' => 'Finish the spreadsheet exercise using SUM, AVERAGE, MIN, and MAX formulas.',
                'due_in_days' => -4,
            ],
        ];
    }
}
