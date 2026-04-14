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
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

test('student sees only assignments from their own class and establishment', function () {
    $first = studentAssignmentContext('primary');
    $second = studentAssignmentContext('secondary');

    $visibleAssignment = Assignment::create([
        'establishment_id' => $first['establishment']->id,
        'academic_year_id' => $first['academic_year']->id,
        'class_id' => $first['class']->id,
        'subject_id' => $first['subject']->id,
        'title' => 'Visible assignment',
        'description' => 'Primary class homework',
        'due_date' => now()->addDays(2)->format('Y-m-d'),
    ]);

    Assignment::create([
        'establishment_id' => $second['establishment']->id,
        'academic_year_id' => $second['academic_year']->id,
        'class_id' => $second['class']->id,
        'subject_id' => $second['subject']->id,
        'title' => 'Hidden assignment',
        'description' => 'Should not appear',
        'due_date' => now()->addDays(3)->format('Y-m-d'),
    ]);

    $this
        ->actingAs($first['student'])
        ->get(route('student.assignments.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Student/Assignments/Index')
            ->where('assignments.data.0.id', $visibleAssignment->id)
            ->where('assignments.data.0.title', 'Visible assignment')
            ->has('assignments.data', 1),
        );
});

test('student can submit an assignment from their own class', function () {
    Storage::fake('public');

    $context = studentAssignmentContext();
    $assignment = Assignment::create([
        'establishment_id' => $context['establishment']->id,
        'academic_year_id' => $context['academic_year']->id,
        'class_id' => $context['class']->id,
        'subject_id' => $context['subject']->id,
        'title' => 'Essay',
        'description' => 'Upload your work',
        'due_date' => now()->addDays(2)->format('Y-m-d'),
    ]);

    $response = $this
        ->actingAs($context['student'])
        ->post(route('student.assignments.submission.store', $assignment), [
            'submission_text' => 'My final version.',
            'attachment' => UploadedFile::fake()->create('essay.pdf', 120, 'application/pdf'),
        ]);

    $response
        ->assertRedirect(route('student.assignments.show', $assignment))
        ->assertSessionHasNoErrors();

    $submission = AssignmentSubmission::query()->firstOrFail();

    expect($submission->assignment_id)->toBe($assignment->id)
        ->and($submission->student_id)->toBe($context['student']->id)
        ->and($submission->establishment_id)->toBe($context['establishment']->id)
        ->and($submission->submission_text)->toBe('My final version.');

    Storage::disk('public')->assertExists($submission->attachment_path);
});

test('student cannot submit an assignment outside their perimeter', function () {
    Storage::fake('public');

    $first = studentAssignmentContext('primary');
    $second = studentAssignmentContext('secondary');

    $foreignAssignment = Assignment::create([
        'establishment_id' => $second['establishment']->id,
        'academic_year_id' => $second['academic_year']->id,
        'class_id' => $second['class']->id,
        'subject_id' => $second['subject']->id,
        'title' => 'Forbidden submission',
        'description' => 'Wrong tenant',
        'due_date' => now()->addDays(1)->format('Y-m-d'),
    ]);

    $this
        ->actingAs($first['student'])
        ->post(route('student.assignments.submission.store', $foreignAssignment), [
            'attachment' => UploadedFile::fake()->create('forbidden.pdf', 40, 'application/pdf'),
        ])
        ->assertForbidden();

    $this->assertDatabaseCount('assignment_submissions', 0);
});

test('student resubmission replaces the previous stored file', function () {
    Storage::fake('public');

    $context = studentAssignmentContext();
    $assignment = Assignment::create([
        'establishment_id' => $context['establishment']->id,
        'academic_year_id' => $context['academic_year']->id,
        'class_id' => $context['class']->id,
        'subject_id' => $context['subject']->id,
        'title' => 'Lab report',
        'description' => 'First draft then final draft',
        'due_date' => now()->addDays(4)->format('Y-m-d'),
    ]);

    $this
        ->actingAs($context['student'])
        ->post(route('student.assignments.submission.store', $assignment), [
            'attachment' => UploadedFile::fake()->create('draft.pdf', 50, 'application/pdf'),
        ])
        ->assertRedirect();

    $firstPath = AssignmentSubmission::query()->value('attachment_path');

    $this
        ->actingAs($context['student'])
        ->post(route('student.assignments.submission.store', $assignment), [
            'submission_text' => 'Updated version',
            'attachment' => UploadedFile::fake()->create('final.pdf', 80, 'application/pdf'),
        ])
        ->assertRedirect();

    $submission = AssignmentSubmission::query()->firstOrFail();

    expect(AssignmentSubmission::query()->count())->toBe(1)
        ->and($submission->submission_text)->toBe('Updated version')
        ->and($submission->attachment_original_name)->toBe('final.pdf')
        ->and($submission->attachment_path)->not->toBe($firstPath);

    Storage::disk('public')->assertMissing($firstPath);
    Storage::disk('public')->assertExists($submission->attachment_path);
});

function studentAssignmentContext(string $suffix = 'default'): array
{
    $establishment = Establishment::create([
        'name' => "Student Assignment {$suffix}",
        'code' => "SAS-{$suffix}",
        'type' => 'School',
        'email' => "{$suffix}-student-assignment@school.test",
    ]);

    $teacher = createStudentAssignmentUserWithRole($establishment, 'teacher');
    $student = createStudentAssignmentUserWithRole($establishment, 'student');
    $class = createStudentAssignmentSchoolClass($establishment);
    $subject = Subject::create([
        'establishment_id' => $establishment->id,
        'name' => "Subject {$suffix}",
    ]);

    ClassSubject::create([
        'class_id' => $class->id,
        'subject_id' => $subject->id,
        'teacher_id' => $teacher->id,
    ]);

    StudentProfile::create([
        'user_id' => $student->id,
        'establishment_id' => $establishment->id,
        'class_id' => $class->id,
        'student_number' => fake()->unique()->bothify("SSA-{$suffix}-###"),
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

    return [
        'establishment' => $establishment,
        'teacher' => $teacher,
        'student' => $student,
        'class' => $class,
        'subject' => $subject,
        'academic_year' => AcademicYear::query()->findOrFail($class->academic_year_id),
    ];
}

function createStudentAssignmentUserWithRole(Establishment $establishment, string $roleName): User
{
    $user = User::factory()->create([
        'establishment_id' => $establishment->id,
    ]);

    $role = Role::firstOrCreate(['name' => $roleName]);
    $user->roles()->syncWithoutDetaching([$role->id]);

    return $user;
}

function createStudentAssignmentSchoolClass(Establishment $establishment): SchoolClass
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
        'name' => fake()->unique()->bothify('Student-Class-##??'),
    ]);
}
