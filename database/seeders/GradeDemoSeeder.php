<?php

namespace Database\Seeders;

use App\Models\AcademicYear;
use App\Models\ClassSubject;
use App\Models\Evaluation;
use App\Models\Grade;
use App\Models\SchoolClass;
use App\Models\StudentProfile;
use App\Models\Subject;
use App\Models\Term;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class GradeDemoSeeder extends Seeder
{
    public function run(): void
    {
        if (! Schema::hasTable('evaluations') || ! Schema::hasTable('grades')) {
            return;
        }

        $teacher = User::query()->where('email', 'teacher@school-management.test')->first();

        if (! $teacher || ! $teacher->establishment_id) {
            return;
        }

        $establishmentId = (int) $teacher->establishment_id;

        $academicYear = AcademicYear::query()
            ->where('establishment_id', $establishmentId)
            ->where('is_current', true)
            ->first()
            ?? AcademicYear::query()
                ->where('establishment_id', $establishmentId)
                ->latest('id')
                ->first();

        if (! $academicYear) {
            return;
        }

        $term = $this->ensureTerm($establishmentId, $academicYear->id);

        $students = User::query()
            ->whereIn('email', [
                'student@school-management.test',
                'student2@school-management.test',
                'student3@school-management.test',
                'student4@school-management.test',
                'student5@school-management.test',
                'student6@school-management.test',
            ])
            ->get()
            ->keyBy('email');

        if ($students->isEmpty()) {
            return;
        }

        $subjects = Subject::query()
            ->where('establishment_id', $establishmentId)
            ->whereIn('name', ['Mathematics', 'English', 'Computer Science'])
            ->get()
            ->keyBy('name');

        $classes = SchoolClass::query()
            ->where('establishment_id', $establishmentId)
            ->whereIn('name', ['Primary A', 'Primary B', 'Middle 1'])
            ->get()
            ->keyBy('name');

        if ($classes->count() < 3 || $subjects->count() < 3) {
            return;
        }

        $this->seedClassEvaluation(
            teacher: $teacher,
            academicYear: $academicYear,
            term: $term,
            schoolClass: $classes['Primary A'],
            subject: $subjects['Mathematics'],
            title: 'Primary A Mathematics Quiz',
            evaluationDate: '2026-03-12',
            rows: [
                'student@school-management.test' => 15.0,
                'student2@school-management.test' => 11.0,
            ],
        );

        $this->seedClassEvaluation(
            teacher: $teacher,
            academicYear: $academicYear,
            term: $term,
            schoolClass: $classes['Primary A'],
            subject: $subjects['English'],
            title: 'Primary A English Assessment',
            evaluationDate: '2026-03-26',
            rows: [
                'student@school-management.test' => 13.0,
                'student2@school-management.test' => 9.0,
            ],
        );

        $this->seedClassEvaluation(
            teacher: $teacher,
            academicYear: $academicYear,
            term: $term,
            schoolClass: $classes['Primary B'],
            subject: $subjects['Mathematics'],
            title: 'Primary B Mathematics Quiz',
            evaluationDate: '2026-03-19',
            rows: [
                'student3@school-management.test' => 8.0,
                'student4@school-management.test' => 12.0,
            ],
        );

        $this->seedClassEvaluation(
            teacher: $teacher,
            academicYear: $academicYear,
            term: $term,
            schoolClass: $classes['Middle 1'],
            subject: $subjects['Computer Science'],
            title: 'Middle 1 Computer Science Project',
            evaluationDate: '2026-04-02',
            rows: [
                'student5@school-management.test' => 16.0,
                'student6@school-management.test' => 7.0,
            ],
        );

        foreach ([
            'student@school-management.test' => $classes['Primary A']->id,
            'student2@school-management.test' => $classes['Primary A']->id,
            'student3@school-management.test' => $classes['Primary B']->id,
            'student4@school-management.test' => $classes['Primary B']->id,
            'student5@school-management.test' => $classes['Middle 1']->id,
            'student6@school-management.test' => $classes['Middle 1']->id,
        ] as $email => $classId) {
            $student = $students->get($email);

            if (! $student) {
                continue;
            }

            $this->ensureStudentMembership($student->id, $classId, $establishmentId);
        }
    }

    private function seedClassEvaluation(
        User $teacher,
        AcademicYear $academicYear,
        ?Term $term,
        SchoolClass $schoolClass,
        Subject $subject,
        string $title,
        string $evaluationDate,
        array $rows,
    ): void {
        $this->ensureTeacherAssignment($teacher->id, $schoolClass->id, $subject->id);

        $evaluation = Evaluation::updateOrCreate(
            [
                'establishment_id' => $teacher->establishment_id,
                'class_id' => $schoolClass->id,
                'subject_id' => $subject->id,
                'term_id' => $term?->id,
                'title' => $title,
            ],
            [
                'evaluation_date' => $evaluationDate,
                'type' => 'quiz',
                'coefficient' => 1,
                'max_grade' => 20,
                'description' => 'Academic dashboard demo dataset.',
                'created_by' => $teacher->id,
                'updated_by' => $teacher->id,
            ],
        );

        $gradeColumns = array_flip(Schema::getColumnListing('grades'));

        foreach ($rows as $studentEmail => $gradeValue) {
            $student = User::query()->where('email', $studentEmail)->first();

            if (! $student) {
                continue;
            }

            $payload = [
                'grade' => $gradeValue,
                'remarks' => null,
            ];

            if (isset($gradeColumns['establishment_id'])) {
                $payload['establishment_id'] = $teacher->establishment_id;
            }

            if (isset($gradeColumns['academic_year_id'])) {
                $payload['academic_year_id'] = $academicYear->id;
            }

            if (isset($gradeColumns['term_id'])) {
                $payload['term_id'] = $term?->id;
            }

            if (isset($gradeColumns['created_by'])) {
                $payload['created_by'] = $teacher->id;
            }

            if (isset($gradeColumns['updated_by'])) {
                $payload['updated_by'] = $teacher->id;
            }

            Grade::query()->updateOrCreate(
                [
                    'evaluation_id' => $evaluation->id,
                    'student_id' => $student->id,
                ],
                $payload,
            );
        }
    }

    private function ensureTerm(int $establishmentId, int $academicYearId): ?Term
    {
        if (! Schema::hasTable('terms')) {
            return null;
        }

        return Term::query()->updateOrCreate(
            [
                'establishment_id' => $establishmentId,
                'academic_year_id' => $academicYearId,
                'name' => 'Term 1',
            ],
            [
                'start_date' => '2025-09-01',
                'end_date' => '2025-12-31',
            ],
        );
    }

    private function ensureTeacherAssignment(int $teacherId, int $classId, int $subjectId): void
    {
        if (! Schema::hasTable('class_subjects')) {
            return;
        }

        ClassSubject::query()->updateOrCreate(
            [
                'class_id' => $classId,
                'subject_id' => $subjectId,
                'teacher_id' => $teacherId,
            ],
            [],
        );
    }

    private function ensureStudentMembership(int $studentId, int $classId, int $establishmentId): void
    {
        StudentProfile::query()->updateOrCreate(
            ['user_id' => $studentId],
            [
                'establishment_id' => $establishmentId,
                'class_id' => $classId,
                'student_number' => StudentProfile::query()
                    ->where('user_id', $studentId)
                    ->value('student_number') ?? 'STU-DEMO-000',
                'date_of_birth' => StudentProfile::query()
                    ->where('user_id', $studentId)
                    ->value('date_of_birth') ?? '2010-01-01',
                'gender' => StudentProfile::query()
                    ->where('user_id', $studentId)
                    ->value('gender') ?? 'male',
                'enrollment_date' => '2025-09-01',
                'status' => 'active',
                'photo_url' => null,
            ],
        );

        if (! Schema::hasTable('class_students')) {
            return;
        }

        DB::table('class_students')->updateOrInsert(
            [
                'class_id' => $classId,
                'student_id' => $studentId,
            ],
            [
                'updated_at' => now(),
                'created_at' => now(),
            ],
        );
    }
}
