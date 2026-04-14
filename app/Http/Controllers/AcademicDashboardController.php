<?php

namespace App\Http\Controllers;

use App\Services\AcademicDashboardService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AcademicDashboardController extends Controller
{
    public function __construct(
        private readonly AcademicDashboardService $dashboardService,
    ) {
    }

    public function index(Request $request): Response
    {
        $user = $request->user();
        abort_unless($user !== null && $user->establishment_id !== null, 403);

        return Inertia::render('AcademicDashboard/Index', $this->dashboardService->buildFor($user));
    }
}
