<?php

use App\Http\Controllers\PlatformAdmin\EstablishmentController;
use App\Http\Controllers\UserManagementController;
use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;

Route::inertia('/', 'welcome', [
    'canRegister' => Features::enabled(Features::registration()),
])->name('home');

Route::middleware('auth')->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');

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
});

require __DIR__.'/settings.php';
