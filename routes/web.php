<?php

use App\Http\Controllers\PlatformAdmin\EstablishmentController;
use App\Http\Controllers\Parent\ReportController as ParentReportController;
use App\Http\Controllers\Parent\ScheduleController as ParentScheduleController;
use App\Http\Controllers\AcademicDashboardController;
use App\Http\Controllers\AcademicReportExportController;
use App\Http\Controllers\DetailedPerformanceAnalysisController;
use App\Http\Controllers\EvaluationController;
use App\Http\Controllers\EstablishmentAdmin\AcademicYearController;
use App\Http\Controllers\EstablishmentAdmin\ParentController;
use App\Http\Controllers\MessagingController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\ParentAccessController;
use App\Http\Controllers\EstablishmentAdmin\ScheduleController;
use App\Http\Controllers\EstablishmentAdmin\StudentController;
use App\Http\Controllers\EstablishmentAdmin\TeacherController;
use App\Http\Controllers\EstablishmentAdmin\ClassController;
use App\Http\Controllers\EstablishmentAdmin\LevelController;
use App\Http\Controllers\EstablishmentAdmin\SubjectController;
use App\Http\Controllers\GradeController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\ScheduleOverviewController;
use App\Http\Controllers\Student\AssignmentController as StudentAssignmentController;
use App\Http\Controllers\StudentAccessController;
use App\Http\Controllers\Teacher\AttendanceController;
use App\Http\Controllers\Teacher\AssignmentController;
use App\Http\Controllers\Teacher\AssignmentSubmissionController;
use App\Http\Controllers\TeacherClassController;
use App\Http\Controllers\TeacherAccessController;
use App\Http\Controllers\UserManagementController;
use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;

Route::inertia('/', 'welcome', [
    'canRegister' => Features::enabled(Features::registration()),
])->name('home');

Route::middleware('guest')->group(function () {
    Route::get('/teacher-access', [TeacherAccessController::class, 'create'])
        ->name('teacher.access');
    Route::post('/teacher-access', [TeacherAccessController::class, 'store'])
        ->middleware('throttle:login')
        ->name('teacher.access.store');
    Route::get('/student-access', [StudentAccessController::class, 'create'])
        ->name('student.access');
    Route::post('/student-access', [StudentAccessController::class, 'store'])
        ->middleware('throttle:login')
        ->name('student.access.store');
    Route::get('/parent-access', [ParentAccessController::class, 'create'])
        ->name('parent.access');
    Route::post('/parent-access', [ParentAccessController::class, 'store'])
        ->middleware('throttle:login')
        ->name('parent.access.store');
});

Route::middleware('auth')->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');
    Route::get('/messaging', [MessagingController::class, 'index'])->name('messaging.index');
    Route::get('/messaging/{participant}', [MessagingController::class, 'index'])
        ->whereNumber('participant')
        ->name('messaging.show');
    Route::post('/messaging', [MessagingController::class, 'store'])->name('messaging.store');
    Route::patch('/messaging/{participant}/read', [MessagingController::class, 'markConversationAsRead'])
        ->whereNumber('participant')
        ->name('messaging.read');

    Route::get('/notifications', [NotificationController::class, 'index'])->name('notifications.index');
    Route::patch('/notifications/{notification}', [NotificationController::class, 'update'])->name('notifications.update');

    Route::middleware(['auth', 'role:platform_admin'])->group(function () {
        Route::inertia('platform-admin', 'PlatformAdminDashboard')->name('platform-admin.dashboard');
        Route::get('/users', [UserManagementController::class, 'index'])->name('users.index');
        Route::post('/users', [UserManagementController::class, 'store'])->name('users.store');
        Route::put('/users/{user}', [UserManagementController::class, 'update'])->name('users.update');
        Route::delete('/users/{user}', [UserManagementController::class, 'destroy'])->name('users.destroy');

        Route::prefix('platform-admin')
            ->name('platform-admin.')
            ->group(function () {
                Route::get('/establishments', [EstablishmentController::class, 'index'])
                    ->name('establishments.index');
                Route::get('/establishments/create', [EstablishmentController::class, 'create'])
                    ->name('establishments.create');
                Route::post('/establishments', [EstablishmentController::class, 'store'])
                    ->name('establishments.store');
                Route::get('/establishments/{establishment}', [EstablishmentController::class, 'show'])
                    ->name('establishments.show');
                Route::get('/establishments/{establishment}/edit', [EstablishmentController::class, 'edit'])
                    ->name('establishments.edit');
                Route::put('/establishments/{establishment}', [EstablishmentController::class, 'update'])
                    ->name('establishments.update');
                Route::delete('/establishments/{establishment}', [EstablishmentController::class, 'destroy'])
                    ->name('establishments.destroy');
                Route::patch('/establishments/{establishment}/toggle-status', [EstablishmentController::class, 'toggleStatus'])
                    ->name('establishments.toggle-status');
            });
    });

    Route::middleware(['auth', 'role:establishment_admin'])->group(function () {
        Route::prefix('establishment-admin')
            ->name('establishment-admin.')
            ->group(function () {
                Route::get('/academic-years', [AcademicYearController::class, 'index'])
                    ->name('academic-years.index');
                Route::get('/academic-years/create', [AcademicYearController::class, 'create'])
                    ->name('academic-years.create');
                Route::post('/academic-years', [AcademicYearController::class, 'store'])
                    ->name('academic-years.store');
                Route::get('/academic-years/{academicYear}', [AcademicYearController::class, 'show'])
                    ->name('academic-years.show');
                Route::get('/academic-years/{academicYear}/edit', [AcademicYearController::class, 'edit'])
                    ->name('academic-years.edit');
                Route::put('/academic-years/{academicYear}', [AcademicYearController::class, 'update'])
                    ->name('academic-years.update');
                Route::delete('/academic-years/{academicYear}', [AcademicYearController::class, 'destroy'])
                    ->name('academic-years.destroy');

                Route::get('/levels', [LevelController::class, 'index'])
                    ->name('levels.index');
                Route::get('/levels/create', [LevelController::class, 'create'])
                    ->name('levels.create');
                Route::post('/levels', [LevelController::class, 'store'])
                    ->name('levels.store');
                Route::get('/levels/{level}', [LevelController::class, 'show'])
                    ->name('levels.show');
                Route::get('/levels/{level}/edit', [LevelController::class, 'edit'])
                    ->name('levels.edit');
                Route::put('/levels/{level}', [LevelController::class, 'update'])
                    ->name('levels.update');
                Route::delete('/levels/{level}', [LevelController::class, 'destroy'])
                    ->name('levels.destroy');

                Route::get('/classes', [ClassController::class, 'index'])
                    ->name('classes.index');
                Route::get('/classes/create', [ClassController::class, 'create'])
                    ->name('classes.create');
                Route::post('/classes', [ClassController::class, 'store'])
                    ->name('classes.store');
                Route::get('/classes/{schoolClass}', [ClassController::class, 'show'])
                    ->name('classes.show');
                Route::get('/classes/{schoolClass}/edit', [ClassController::class, 'edit'])
                    ->name('classes.edit');
                Route::put('/classes/{schoolClass}', [ClassController::class, 'update'])
                    ->name('classes.update');
                Route::delete('/classes/{schoolClass}', [ClassController::class, 'destroy'])
                    ->name('classes.destroy');

                Route::get('/subjects', [SubjectController::class, 'index'])
                    ->name('subjects.index');
                Route::get('/subjects/create', [SubjectController::class, 'create'])
                    ->name('subjects.create');
                Route::post('/subjects', [SubjectController::class, 'store'])
                    ->name('subjects.store');
                Route::get('/subjects/{subject}', [SubjectController::class, 'show'])
                    ->name('subjects.show');
                Route::get('/subjects/{subject}/edit', [SubjectController::class, 'edit'])
                    ->name('subjects.edit');
                Route::put('/subjects/{subject}', [SubjectController::class, 'update'])
                    ->name('subjects.update');
                Route::delete('/subjects/{subject}', [SubjectController::class, 'destroy'])
                    ->name('subjects.destroy');

                Route::resource('teachers', TeacherController::class);
                Route::resource('students', StudentController::class);
                Route::resource('parents', ParentController::class);
                Route::get('/schedules/feed', [ScheduleController::class, 'calendarFeed'])
                    ->name('schedules.feed');
                Route::resource('schedules', ScheduleController::class);
                Route::post('/parents/{parent}/students', [ParentController::class, 'assignStudent'])
                    ->name('parents.assign-student');
            });
    });

    Route::middleware(['auth', 'role:establishment_admin|admin'])->group(function () {
        Route::get('/academic-dashboard', [AcademicDashboardController::class, 'index'])
            ->name('academic-dashboard.index');
        Route::get('/performance-analysis', [DetailedPerformanceAnalysisController::class, 'index'])
            ->name('performance-analysis.index');
        Route::get('/reports/exports', [AcademicReportExportController::class, 'index'])
            ->name('reports.exports.index');
        Route::get('/reports/exports/pdf', [AcademicReportExportController::class, 'pdf'])
            ->name('reports.exports.pdf');
        Route::get('/reports/exports/excel', [AcademicReportExportController::class, 'excel'])
            ->name('reports.exports.excel');
    });

    Route::middleware(['auth', 'role:teacher'])->group(function () {
        Route::get('/teacher/classes', [TeacherClassController::class, 'index'])
            ->name('teacher.classes.index');
        Route::get('/teacher/schedules', [ScheduleOverviewController::class, 'teacherIndex'])
            ->name('teacher.schedules.index');
        Route::get('/teacher/schedules/feed', [ScheduleOverviewController::class, 'teacherFeed'])
            ->name('teacher.schedules.feed');
        Route::get('/teacher/attendances', [AttendanceController::class, 'index'])
            ->name('teacher.attendances.index');
        Route::get('/teacher/attendances/history', [AttendanceController::class, 'history'])
            ->name('teacher.attendances.history');
        Route::get('/teacher/attendances/{schedule}/edit', [AttendanceController::class, 'edit'])
            ->name('teacher.attendances.edit');
        Route::post('/teacher/attendances', [AttendanceController::class, 'store'])
            ->name('teacher.attendances.store');
        Route::get('/teacher/assignments', [AssignmentController::class, 'index'])
            ->name('teacher.assignments.index');
        Route::get('/teacher/assignments/create', [AssignmentController::class, 'create'])
            ->name('teacher.assignments.create');
        Route::post('/teacher/assignments', [AssignmentController::class, 'store'])
            ->name('teacher.assignments.store');
        Route::get('/teacher/assignments/{assignment}/edit', [AssignmentController::class, 'edit'])
            ->name('teacher.assignments.edit');
        Route::put('/teacher/assignments/{assignment}', [AssignmentController::class, 'update'])
            ->name('teacher.assignments.update');
        Route::delete('/teacher/assignments/{assignment}', [AssignmentController::class, 'destroy'])
            ->name('teacher.assignments.destroy');
        Route::get('/teacher/assignment-submissions', [AssignmentSubmissionController::class, 'index'])
            ->name('teacher.assignment-submissions.index');
        Route::get('/teacher/assignments/{assignment}/submissions/{submission}/download', [AssignmentSubmissionController::class, 'download'])
            ->name('teacher.assignment-submissions.download');
    });

    Route::middleware(['auth', 'role:teacher|establishment_admin'])->group(function () {
        Route::get('/evaluations', [EvaluationController::class, 'index'])
            ->name('evaluations.index');
        Route::get('/evaluations/create', [EvaluationController::class, 'create'])
            ->name('evaluations.create');
        Route::post('/evaluations', [EvaluationController::class, 'store'])
            ->name('evaluations.store');
        Route::get('/evaluations/{evaluation}/edit', [EvaluationController::class, 'edit'])
            ->name('evaluations.edit');
        Route::put('/evaluations/{evaluation}', [EvaluationController::class, 'update'])
            ->name('evaluations.update');
        Route::delete('/evaluations/{evaluation}', [EvaluationController::class, 'destroy'])
            ->name('evaluations.destroy');

        Route::get('/evaluations/{evaluation}/grades', [GradeController::class, 'edit'])
            ->name('evaluations.grades.edit');
        Route::post('/evaluations/{evaluation}/grades', [GradeController::class, 'store'])
            ->name('evaluations.grades.store');
        Route::put('/evaluations/{evaluation}/grades/{grade}', [GradeController::class, 'update'])
            ->name('evaluations.grades.update');
        Route::delete('/evaluations/{evaluation}/grades/{grade}', [GradeController::class, 'destroy'])
            ->name('evaluations.grades.destroy');

        Route::get('/reports/student/{student}', [ReportController::class, 'showStudent'])
            ->name('reports.student.show');
    });

    Route::middleware(['auth', 'role:student'])->group(function () {
        Route::get('/student/schedules', [ScheduleOverviewController::class, 'studentIndex'])
            ->name('student.schedules.index');
        Route::get('/student/schedules/feed', [ScheduleOverviewController::class, 'studentFeed'])
            ->name('student.schedules.feed');
        Route::get('/student/assignments', [StudentAssignmentController::class, 'index'])
            ->name('student.assignments.index');
        Route::get('/student/assignments/{assignment}', [StudentAssignmentController::class, 'show'])
            ->name('student.assignments.show');
        Route::post('/student/assignments/{assignment}/submission', [StudentAssignmentController::class, 'storeSubmission'])
            ->name('student.assignments.submission.store');
    });

    Route::middleware(['auth', 'role:parent'])->group(function () {
        Route::get('/parent/reports/{student?}', [ParentReportController::class, 'index'])
            ->whereNumber('student')
            ->name('parent.reports.index');
        Route::get('/parent/schedules/{student?}', [ParentScheduleController::class, 'index'])
            ->whereNumber('student')
            ->name('parent.schedules.index');
        Route::get('/parent/schedules/{student}/feed', [ParentScheduleController::class, 'feed'])
            ->whereNumber('student')
            ->name('parent.schedules.feed');
    });
});

require __DIR__.'/settings.php';
