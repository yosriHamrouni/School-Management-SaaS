<?php

use App\Models\AcademicYear;
use App\Models\Assignment;
use App\Models\AssignmentSubmission;
use App\Models\ClassSubject;
use App\Models\Establishment;
use App\Models\Level;
use App\Models\Role;
use App\Models\SchoolClass;
use App\Models\StudentProfile;
use App\Models\Subject;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

test('teacher can review submitted pending and late assignment rows', function () {
    Storage::fake('public');

    $context = teacherSubmissionContext();
    $assignment = Assignment::create([
        'establishment_id' => $context['establishment']->id,
        'academic_year_id' => $context['academic_year']->id,
        'class_id' => $context['class']->id,
        'subject_id' => $context['subject']->id,
        'title' => 'Homework status board',
        'description' => 'Review all statuses',
        'due_date' => now()->subDay()->format('Y-m-d'),
    ]);

    $submittedPath = "assignments/{$context['establishment']->id}/students/{$context['submitted_student']->id}/submitted.pdf";
    $latePath = "assignments/{$context['establishment']->id}/students/{$context['late_student']->id}/late.pdf";

    Storage::disk('public')->put($submittedPath, 'submitted');
    Storage::disk('public')->put($latePath, 'late');

    AssignmentSubmission::create([
        'establishment_id' => $context['establishment']->id,
        'assignment_id' => $assignment->id,
        'student_id' => $context['submitted_student']->id,
        'submission_text' => 'On time',
        'attachment_path' => $submittedPath,
        'attachment_original_name' => 'submitted.pdf',
        'attachment_mime' => 'application/pdf',
        'attachment_size' => 1234,
        'submitted_at' => now()->subDays(2),
    ]);

    AssignmentSubmission::create([
        'establishment_id' => $context['establishment']->id,
        'assignment_id' => $assignment->id,
        'student_id' => $context['late_student']->id,
        'submission_text' => 'Late',
        'attachment_path' => $latePath,
        'attachment_original_name' => 'late.pdf',
        'attachment_mime' => 'application/pdf',
        'attachment_size' => 2345,
        'submitted_at' => now(),
    ]);

    $this
        ->actingAs($context['teacher'])
        ->get(route('teacher.assignment-submissions.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Teacher/AssignmentSubmissions/Index')
            ->has('submissions.data', 3)
            ->where('submissions.data.0.student_name', 'Alpha Student')
            ->where('submissions.data.0.status', 'submitted')
            ->where('submissions.data.1.student_name', 'Beta Student')
            ->where('submissions.data.1.status', 'late')
            ->where('submissions.data.2.student_name', 'Gamma Student')
            ->where('submissions.data.2.status', 'pending'),
        );
});

test('teacher can filter assignment submissions by status', function () {
    Storage::fake('public');

    $context = teacherSubmissionContext('filter');
    $assignment = Assignment::create([
        'establishment_id' => $context['establishment']->id,
        'academic_year_id' => $context['academic_year']->id,
        'class_id' => $context['class']->id,
        'subject_id' => $context['subject']->id,
        'title' => 'Late only',
        'description' => 'Filter test',
        'due_date' => now()->subDay()->format('Y-m-d'),
    ]);

    $latePath = "assignments/{$context['establishment']->id}/students/{$context['late_student']->id}/filter-late.pdf";
    Storage::disk('public')->put($latePath, 'late');

    AssignmentSubmission::create([
        'establishment_id' => $context['establishment']->id,
        'assignment_id' => $assignment->id,
        'student_id' => $context['late_student']->id,
        'attachment_path' => $latePath,
        'attachment_original_name' => 'filter-late.pdf',
        'attachment_mime' => 'application/pdf',
        'attachment_size' => 2048,
        'submitted_at' => now(),
    ]);

    $this
        ->actingAs($context['teacher'])
        ->get(route('teacher.assignment-submissions.index', ['status' => 'late']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Teacher/AssignmentSubmissions/Index')
            ->has('submissions.data', 1)
            ->where('submissions.data.0.student_name', 'Beta Student')
            ->where('submissions.data.0.status', 'late'),
        );
});

test('teacher can download a submission file only for an accessible assignment', function () {
    Storage::fake('public');

    $context = teacherSubmissionContext('download');
    $assignment = Assignment::create([
        'establishment_id' => $context['establishment']->id,
        'academic_year_id' => $context['academic_year']->id,
        'class_id' => $context['class']->id,
        'subject_id' => $context['subject']->id,
        'title' => 'Download test',
        'description' => 'File download',
        'due_date' => now()->addDays(2)->format('Y-m-d'),
    ]);

    $path = "assignments/{$context['establishment']->id}/students/{$context['submitted_student']->id}/download.pdf";
    Storage::disk('public')->put($path, 'downloadable');

    $submission = AssignmentSubmission::create([
        'establishment_id' => $context['establishment']->id,
        'assignment_id' => $assignment->id,
        'student_id' => $context['submitted_student']->id,
        'attachment_path' => $path,
        'attachment_original_name' => 'download.pdf',
        'attachment_mime' => 'application/pdf',
        'attachment_size' => 512,
        'submitted_at' => now(),
    ]);

    $this
        ->actingAs($context['teacher'])
        ->get(route('teacher.assignment-submissions.download', [
            'assignment' => $assignment,
            'submission' => $submission,
        ]))
        ->assertOk()
        ->assertDownload('download.pdf');
});

test('teacher cannot view or download submissions outside their perimeter', function () {
    Storage::fake('public');

    $first = teacherSubmissionContext('first');
    $second = teacherSubmissionContext('second');

    $assignment = Assignment::create([
        'establishment_id' => $second['establishment']->id,
        'academic_year_id' => $second['academic_year']->id,
        'class_id' => $second['class']->id,
        'subject_id' => $second['subject']->id,
        'title' => 'Protected submission',
        'description' => 'Forbidden',
        'due_date' => now()->addDay()->format('Y-m-d'),
    ]);

    $path = "assignments/{$second['establishment']->id}/students/{$second['submitted_student']->id}/protected.pdf";
    Storage::disk('public')->put($path, 'protected');

    $submission = AssignmentSubmission::create([
        'establishment_id' => $second['establishment']->id,
        'assignment_id' => $assignment->id,
        'student_id' => $second['submitted_student']->id,
        'attachment_path' => $path,
        'attachment_original_name' => 'protected.pdf',
        'attachment_mime' => 'application/pdf',
        'attachment_size' => 100,
        'submitted_at' => now(),
    ]);

    $this
        ->actingAs($first['teacher'])
        ->get(route('teacher.assignment-submissions.index', ['assignment_id' => $assignment->id]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Teacher/AssignmentSubmissions/Index')
            ->where('submissions.data', []),
        );

    $this
        ->actingAs($first['teacher'])
        ->get(route('teacher.assignment-submissions.download', [
            'assignment' => $assignment,
            'submission' => $submission,
        ]))
        ->assertForbidden();
});

function teacherSubmissionContext(string $suffix = 'default'): array
{
    $establishment = Establishment::create([
        'name' => "Teacher Submissions {$suffix}",
        'code' => "TSB-{$suffix}",
        'type' => 'School',
        'email' => "{$suffix}-teacher-submissions@school.test",
    ]);

    $teacher = createTeacherSubmissionUser($establishment, 'teacher', 'Teacher Demo');
    $class = createTeacherSubmissionSchoolClass($establishment);
    $subject = Subject::create([
        'establishment_id' => $establishment->id,
        'name' => "Mathematics {$suffix}",
    ]);

    ClassSubject::create([
        'class_id' => $class->id,
        'subject_id' => $subject->id,
        'teacher_id' => $teacher->id,
    ]);

    $submittedStudent = createTeacherSubmissionStudent($establishment, $class, 'Alpha Student', "TSA-{$suffix}-A");
    $lateStudent = createTeacherSubmissionStudent($establishment, $class, 'Beta Student', "TSA-{$suffix}-B");
    $pendingStudent = createTeacherSubmissionStudent($establishment, $class, 'Gamma Student', "TSA-{$suffix}-C");

    return [
        'establishment' => $establishment,
        'teacher' => $teacher,
        'class' => $class,
        'subject' => $subject,
        'submitted_student' => $submittedStudent,
        'late_student' => $lateStudent,
        'pending_student' => $pendingStudent,
        'academic_year' => AcademicYear::query()->findOrFail($class->academic_year_id),
    ];
}

function createTeacherSubmissionUser(Establishment $establishment, string $roleName, string $name): User
{
    $user = User::factory()->create([
        'name' => $name,
        'establishment_id' => $establishment->id,
    ]);

    $role = Role::firstOrCreate(['name' => $roleName]);
    $user->roles()->syncWithoutDetaching([$role->id]);

    return $user;
}

function createTeacherSubmissionSchoolClass(Establishment $establishment): SchoolClass
{
    $academicYear = AcademicYear::firstOrCreate([
        'establishment_id' => $establishment->id,
        'name' => '2025-2026',
    ], [
        'establishment_id' => $establishment->id,
        'name' => '2025-2026',
        'start_date' => '2025-09-01',
        'end_date' => '2026-06-30',
        'status' => 'active',
        'is_current' => true,
    ]);

    $level = Level::create([
        'establishment_id' => $establishment->id,
        'name' => fake()->unique()->word(),
    ]);

    return SchoolClass::create([
        'establishment_id' => $establishment->id,
        'level_id' => $level->id,
        'academic_year_id' => $academicYear->id,
        'name' => fake()->unique()->bothify('Teacher-Class-##??'),
    ]);
}

function createTeacherSubmissionStudent(
    Establishment $establishment,
    SchoolClass $class,
    string $name,
    string $studentNumber,
): User {
    $student = createTeacherSubmissionUser($establishment, 'student', $name);

    StudentProfile::create([
        'user_id' => $student->id,
        'establishment_id' => $establishment->id,
        'class_id' => $class->id,
        'student_number' => $studentNumber,
    ]);

    $payload = [
        'class_id' => $class->id,
        'student_id' => $student->id,
        'created_at' => now(),
        'updated_at' => now(),
    ];

    if (\Illuminate\Support\Facades\Schema::hasColumn('class_students', 'academic_year_id')) {
        $payload['academic_year_id'] = $class->academic_year_id;
    }

    if (\Illuminate\Support\Facades\Schema::hasColumn('class_students', 'establishment_id')) {
        $payload['establishment_id'] = $establishment->id;
    }

    DB::table('class_students')->insert($payload);

    return $student;
}
