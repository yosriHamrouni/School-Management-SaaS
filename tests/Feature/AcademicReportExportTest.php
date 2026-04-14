<?php

use App\Models\AcademicYear;
use App\Models\ClassSubject;
use App\Models\Evaluation;
use App\Models\Establishment;
use App\Models\Grade;
use App\Models\Level;
use App\Models\Role;
use App\Models\SchoolClass;
use App\Models\StudentProfile;
use App\Models\Subject;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('academic report export is restricted to administration roles', function () {
    $user = User::factory()->create([
        'establishment_id' => Establishment::create([
            'name' => 'Export Auth School',
            'code' => 'EXP-AUTH',
            'type' => 'School',
            'email' => 'export-auth@school.test',
        ])->id,
    ]);

    $user->roles()->syncWithoutDetaching([
        Role::firstOrCreate(['name' => 'teacher'])->id,
    ]);

    $this
        ->actingAs($user)
        ->get(route('reports.exports.index'))
        ->assertForbidden();
});

test('academic report export page returns period filtered tenant scoped data', function () {
    [$establishment, $admin] = createAcademicExportAdmin('Export Main', 'EXP-MAIN', 'export-main@school.test');
    [$otherEstablishment] = createAcademicExportAdmin('Export Other', 'EXP-OTHER', 'export-other@school.test');

    $classA = createAcademicExportClass($establishment, 'Class A');
    $classB = createAcademicExportClass($establishment, 'Class B');
    $otherClass = createAcademicExportClass($otherEstablishment, 'Class Z');

    $math = Subject::create([
        'establishment_id' => $establishment->id,
        'name' => 'Mathematics',
    ]);
    $english = Subject::create([
        'establishment_id' => $establishment->id,
        'name' => 'English',
    ]);
    $physics = Subject::create([
        'establishment_id' => $otherEstablishment->id,
        'name' => 'Physics',
    ]);

    $teacherAlpha = createAcademicExportTeacher($establishment, 'Teacher Alpha', 'alpha@export.test');
    $teacherBeta = createAcademicExportTeacher($establishment, 'Teacher Beta', 'beta@export.test');
    $teacherOther = createAcademicExportTeacher($otherEstablishment, 'Teacher Other', 'other@export.test');

    ClassSubject::create([
        'class_id' => $classA->id,
        'subject_id' => $math->id,
        'teacher_id' => $teacherAlpha->id,
    ]);
    ClassSubject::create([
        'class_id' => $classB->id,
        'subject_id' => $english->id,
        'teacher_id' => $teacherBeta->id,
    ]);
    ClassSubject::create([
        'class_id' => $otherClass->id,
        'subject_id' => $physics->id,
        'teacher_id' => $teacherOther->id,
    ]);

    $studentA = createAcademicExportStudent($establishment, 'student-a@export.test');
    $studentB = createAcademicExportStudent($establishment, 'student-b@export.test');
    $studentOther = createAcademicExportStudent($otherEstablishment, 'student-other@export.test');

    $evaluationInPeriod = Evaluation::create([
        'establishment_id' => $establishment->id,
        'class_id' => $classA->id,
        'subject_id' => $math->id,
        'title' => 'Math Exam',
        'evaluation_date' => '2026-02-10',
        'type' => 'exam',
        'coefficient' => 1,
        'max_grade' => 20,
        'created_by' => $admin->id,
        'updated_by' => $admin->id,
    ]);

    $evaluationOutsidePeriod = Evaluation::create([
        'establishment_id' => $establishment->id,
        'class_id' => $classB->id,
        'subject_id' => $english->id,
        'title' => 'English Exam',
        'evaluation_date' => '2026-03-15',
        'type' => 'exam',
        'coefficient' => 1,
        'max_grade' => 20,
        'created_by' => $admin->id,
        'updated_by' => $admin->id,
    ]);

    $otherEvaluation = Evaluation::create([
        'establishment_id' => $otherEstablishment->id,
        'class_id' => $otherClass->id,
        'subject_id' => $physics->id,
        'title' => 'Physics Exam',
        'evaluation_date' => '2026-02-12',
        'type' => 'exam',
        'coefficient' => 1,
        'max_grade' => 20,
        'created_by' => $teacherOther->id,
        'updated_by' => $teacherOther->id,
    ]);

    Grade::create([
        'establishment_id' => $establishment->id,
        'evaluation_id' => $evaluationInPeriod->id,
        'student_id' => $studentA->id,
        'grade' => 14,
        'created_by' => $admin->id,
        'updated_by' => $admin->id,
    ]);
    Grade::create([
        'establishment_id' => $establishment->id,
        'evaluation_id' => $evaluationInPeriod->id,
        'student_id' => $studentB->id,
        'grade' => 8,
        'created_by' => $admin->id,
        'updated_by' => $admin->id,
    ]);
    Grade::create([
        'establishment_id' => $establishment->id,
        'evaluation_id' => $evaluationOutsidePeriod->id,
        'student_id' => $studentA->id,
        'grade' => 19,
        'created_by' => $admin->id,
        'updated_by' => $admin->id,
    ]);
    Grade::create([
        'establishment_id' => $otherEstablishment->id,
        'evaluation_id' => $otherEvaluation->id,
        'student_id' => $studentOther->id,
        'grade' => 18,
        'created_by' => $teacherOther->id,
        'updated_by' => $teacherOther->id,
    ]);

    $this
        ->actingAs($admin)
        ->get(route('reports.exports.index', [
            'start_date' => '2026-02-01',
            'end_date' => '2026-02-28',
        ]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Reports/Export')
            ->where('filters.startDate', '2026-02-01')
            ->where('filters.endDate', '2026-02-28')
            ->where('report.meta.hasAcademicData', true)
            ->where('report.stats.totalClasses', 2)
            ->where('report.stats.totalStudents', 2)
            ->where('report.stats.totalSubjects', 2)
            ->where('report.stats.totalTeachers', 2)
            ->where('report.stats.globalAverage', 11.0)
            ->where('report.stats.successRate', 50.0)
            ->where('report.stats.gradesCount', 2)
            ->where('report.classAverages.0.className', 'Class A')
            ->where('report.classAverages.0.average', 11.0)
            ->where('report.classAverages.1.className', 'Class B')
            ->where('report.classAverages.1.average', 0.0)
            ->where('report.subjectAverages.0.name', 'English')
            ->where('report.subjectAverages.0.average', 0.0)
            ->where('report.subjectAverages.1.name', 'Mathematics')
            ->where('report.subjectAverages.1.average', 11.0)
            ->where('report.teacherPerformance.0.name', 'Teacher Alpha')
            ->where('report.teacherPerformance.0.average', 11.0)
            ->where('report.teacherPerformance.0.successRate', 50.0)
            ->where('report.teacherPerformance.1.name', 'Teacher Beta')
            ->where('report.teacherPerformance.1.average', 0.0),
        );
});

test('academic report export rejects invalid period', function () {
    [$establishment, $admin] = createAcademicExportAdmin('Export Validation', 'EXP-VALID', 'export-valid@school.test');

    $this
        ->actingAs($admin)
        ->from(route('reports.exports.index'))
        ->get(route('reports.exports.index', [
            'start_date' => '2026-04-10',
            'end_date' => '2026-04-01',
        ]))
        ->assertRedirect(route('reports.exports.index'))
        ->assertSessionHasErrors(['end_date']);
});

test('academic report export returns clean state when no data exists for the selected period', function () {
    [$establishment, $admin] = createAcademicExportAdmin('Export Empty', 'EXP-EMPTY', 'export-empty@school.test');

    createAcademicExportClass($establishment, 'Class Empty');
    Subject::create([
        'establishment_id' => $establishment->id,
        'name' => 'History',
    ]);

    $this
        ->actingAs($admin)
        ->get(route('reports.exports.excel', [
            'start_date' => '2026-01-01',
            'end_date' => '2026-01-31',
        ]))
        ->assertRedirect(route('reports.exports.index', [
            'start_date' => '2026-01-01',
            'end_date' => '2026-01-31',
        ]))
        ->assertSessionHas('error', "Aucune donnee academique n'est disponible pour la periode selectionnee.");
});

function createAcademicExportAdmin(string $name, string $code, string $email): array
{
    $establishment = Establishment::create([
        'name' => $name,
        'code' => $code,
        'type' => 'School',
        'email' => $email,
    ]);

    $admin = User::factory()->create([
        'establishment_id' => $establishment->id,
    ]);

    $admin->roles()->syncWithoutDetaching([
        Role::firstOrCreate(['name' => 'establishment_admin'])->id,
    ]);

    return [$establishment, $admin];
}

function createAcademicExportClass(Establishment $establishment, string $name): SchoolClass
{
    $academicYear = AcademicYear::firstOrCreate(
        [
            'establishment_id' => $establishment->id,
            'name' => '2025-2026',
        ],
        [
            'start_date' => '2025-09-01',
            'end_date' => '2026-06-30',
            'status' => 'active',
            'is_current' => true,
        ],
    );

    $level = Level::create([
        'establishment_id' => $establishment->id,
        'name' => fake()->unique()->word(),
    ]);

    return SchoolClass::create([
        'establishment_id' => $establishment->id,
        'level_id' => $level->id,
        'academic_year_id' => $academicYear->id,
        'name' => $name,
    ]);
}

function createAcademicExportTeacher(Establishment $establishment, string $name, string $email): User
{
    $teacher = User::factory()->create([
        'name' => $name,
        'email' => $email,
        'establishment_id' => $establishment->id,
    ]);

    $teacher->roles()->syncWithoutDetaching([
        Role::firstOrCreate(['name' => 'teacher'])->id,
    ]);

    return $teacher;
}

function createAcademicExportStudent(Establishment $establishment, string $email): User
{
    $student = User::factory()->create([
        'email' => $email,
        'establishment_id' => $establishment->id,
    ]);

    $student->roles()->syncWithoutDetaching([
        Role::firstOrCreate(['name' => 'student'])->id,
    ]);

    StudentProfile::create([
        'user_id' => $student->id,
        'establishment_id' => $establishment->id,
        'student_number' => fake()->unique()->bothify('EXP-###'),
    ]);

    return $student;
}
