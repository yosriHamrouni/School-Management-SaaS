<?php

namespace App\Http\Controllers\Risk;

use App\Http\Controllers\Controller;
use App\Http\Requests\Risk\IndexRiskStudentsRequest;
use App\Http\Requests\Risk\ShowRiskStudentRequest;
use App\Http\Resources\Risk\RiskStudentListResource;
use App\Http\Resources\Risk\RiskStudentShowResource;
use App\Models\AcademicYear;
use App\Models\StudentProfile;
use App\Models\StudentRiskPrediction;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class RiskStudentController extends Controller
{
    public function index(IndexRiskStudentsRequest $request): AnonymousResourceCollection
    {
        $establishmentId = $this->establishmentId($request);
        $schoolYearId = $this->resolveSchoolYearId(
            $establishmentId,
            $request->validated('school_year_id'),
        );
        $validated = $request->validated();
        $search = trim((string) ($validated['search'] ?? ''));
        $perPage = (int) ($validated['per_page'] ?? 15);

        $latestPredictionIds = StudentRiskPrediction::query()
            ->selectRaw('MAX(id) as id')
            ->where('establishment_id', $establishmentId)
            ->where('school_year_id', $schoolYearId)
            ->groupBy('student_id');

        $predictions = StudentRiskPrediction::query()
            ->with([
                'student.user:id,name',
                'student.schoolClass:id,name',
            ])
            ->whereIn('id', $latestPredictionIds)
            ->where('establishment_id', $establishmentId)
            ->where('school_year_id', $schoolYearId)
            ->when(
                isset($validated['risk_level']),
                fn (Builder $query): Builder => $query->where('risk_level', $validated['risk_level']),
            )
            ->when(
                isset($validated['class_id']),
                fn (Builder $query): Builder => $query->whereHas(
                    'student',
                    fn (Builder $studentQuery): Builder => $studentQuery->where('class_id', $validated['class_id']),
                ),
            )
            ->when($search !== '', function (Builder $query) use ($search): void {
                $query->whereHas('student', function (Builder $studentQuery) use ($search): void {
                    $studentQuery->where(function (Builder $nestedQuery) use ($search): void {
                        $nestedQuery
                            ->where('student_number', 'like', "%{$search}%")
                            ->orWhereHas('user', fn (Builder $userQuery): Builder => $userQuery->where('name', 'like', "%{$search}%"));
                    });
                });
            })
            ->orderByDesc(DB::raw("case risk_level when 'high' then 3 when 'medium' then 2 else 1 end"))
            ->orderByDesc('risk_score')
            ->orderByDesc('analyzed_at')
            ->orderByDesc('id')
            ->paginate($perPage)
            ->withQueryString();

        return RiskStudentListResource::collection($predictions);
    }

    public function show(ShowRiskStudentRequest $request, int $studentId): RiskStudentShowResource
    {
        $establishmentId = $this->establishmentId($request);
        $schoolYearId = $this->resolveSchoolYearId(
            $establishmentId,
            $request->validated('school_year_id'),
        );

        $student = StudentProfile::query()
            ->with([
                'user:id,name',
                'schoolClass:id,name',
            ])
            ->where('establishment_id', $establishmentId)
            ->findOrFail($studentId);

        $prediction = StudentRiskPrediction::query()
            ->where('student_id', $student->id)
            ->where('establishment_id', $establishmentId)
            ->where('school_year_id', $schoolYearId)
            ->latest('analyzed_at')
            ->latest('id')
            ->first();

        return new RiskStudentShowResource([
            'student' => $student,
            'risk_prediction' => $prediction,
        ]);
    }

    private function establishmentId(IndexRiskStudentsRequest|ShowRiskStudentRequest $request): int
    {
        $user = $request->user();
        abort_unless($user !== null && $user->establishment_id !== null, 403);

        return (int) $user->establishment_id;
    }

    private function resolveSchoolYearId(int $establishmentId, mixed $requestedSchoolYearId): int
    {
        if (is_numeric($requestedSchoolYearId)) {
            return (int) $requestedSchoolYearId;
        }

        $schoolYearId = AcademicYear::query()
            ->where('establishment_id', $establishmentId)
            ->where('status', 'active')
            ->where('is_current', true)
            ->value('id');

        if ($schoolYearId === null) {
            throw ValidationException::withMessages([
                'school_year_id' => 'No active school year is configured for this establishment.',
            ]);
        }

        return (int) $schoolYearId;
    }
}
