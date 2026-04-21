<?php

namespace App\Http\Controllers\Risk;

use App\Http\Controllers\Controller;
use App\Services\Risk\StudentRiskDataService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StudentRiskAnalysisController extends Controller
{
    public function __construct(
        private readonly StudentRiskDataService $studentRiskDataService,
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_unless($user !== null && $user->establishment_id !== null, 403);

        $validated = $request->validate([
            'school_year_id' => ['required', 'integer', 'exists:academic_years,id'],
        ]);

        $studentsData = $this->studentRiskDataService->getStudentsDataForRiskAnalysis(
            (int) $user->establishment_id,
            (int) $validated['school_year_id'],
        );

        return response()->json([
            'data' => $studentsData,
            'count' => $studentsData->count(),
        ]);
    }
}
