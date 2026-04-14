<?php

namespace App\Http\Controllers;

use App\Services\DetailedPerformanceAnalysisService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DetailedPerformanceAnalysisController extends Controller
{
    public function __construct(
        private readonly DetailedPerformanceAnalysisService $analysisService,
    ) {
    }

    public function index(Request $request): Response
    {
        $user = $request->user();
        abort_unless($user !== null && $user->establishment_id !== null, 403);

        return Inertia::render('DetailedPerformance/Index', $this->analysisService->buildFor($user));
    }
}
