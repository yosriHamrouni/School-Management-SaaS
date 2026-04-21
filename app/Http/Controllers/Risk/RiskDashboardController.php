<?php

namespace App\Http\Controllers\Risk;

use App\Http\Controllers\Controller;
use App\Http\Requests\Risk\IndexRiskStudentsRequest;
use App\Http\Requests\Risk\ShowRiskStudentRequest;
use App\Models\AcademicYear;
use App\Models\SchoolClass;
use App\Models\StudentProfile;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class RiskDashboardController extends Controller
{
    public function index(IndexRiskStudentsRequest $request): Response
    {
        $establishmentId = $this->establishmentId($request);
        $schoolYearId = $this->resolveSchoolYearId(
            $establishmentId,
            $request->validated('school_year_id'),
        );
        $validated = $request->validated();

        return Inertia::render('Risk/Index', [
            'filters' => [
                'search' => (string) ($validated['search'] ?? ''),
                'class_id' => isset($validated['class_id']) ? (string) $validated['class_id'] : '',
                'risk_level' => (string) ($validated['risk_level'] ?? ''),
                'school_year_id' => (string) $schoolYearId,
                'per_page' => (string) ($validated['per_page'] ?? 15),
                'page' => (string) max(1, (int) $request->integer('page', 1)),
            ],
            'defaults' => [
                'school_year_id' => (string) $schoolYearId,
                'per_page' => '15',
            ],
            'schoolYears' => $this->schoolYearOptions($establishmentId),
            'classes' => $this->classOptions($establishmentId, $schoolYearId),
        ]);
    }

    public function show(ShowRiskStudentRequest $request, int $student): Response
    {
        $establishmentId = $this->establishmentId($request);
        $schoolYearId = $this->resolveSchoolYearId(
            $establishmentId,
            $request->validated('school_year_id'),
        );

        $studentProfile = StudentProfile::query()
            ->with(['user:id,name', 'schoolClass:id,name'])
            ->where('establishment_id', $establishmentId)
            ->findOrFail($student);

        return Inertia::render('Risk/Show', [
            'studentId' => (int) $studentProfile->id,
            'studentPreview' => [
                'full_name' => $studentProfile->user?->name,
                'student_number' => $studentProfile->student_number,
                'class_name' => $studentProfile->schoolClass?->name,
            ],
            'filters' => [
                'school_year_id' => (string) $schoolYearId,
            ],
            'defaults' => [
                'school_year_id' => (string) $schoolYearId,
            ],
            'schoolYears' => $this->schoolYearOptions($establishmentId),
            'backUrl' => '/risk?school_year_id='.$schoolYearId,
        ]);
    }

    private function establishmentId(Request $request): int
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

        $activeSchoolYearId = AcademicYear::query()
            ->where('establishment_id', $establishmentId)
            ->where('status', 'active')
            ->where('is_current', true)
            ->value('id');

        if ($activeSchoolYearId !== null) {
            return (int) $activeSchoolYearId;
        }

        return (int) AcademicYear::query()
            ->where('establishment_id', $establishmentId)
            ->orderByDesc('start_date')
            ->value('id');
    }

    /**
     * @return array<int, array{id: number, name: string}>
     */
    private function schoolYearOptions(int $establishmentId): array
    {
        return AcademicYear::query()
            ->where('establishment_id', $establishmentId)
            ->orderByDesc('is_current')
            ->orderByDesc('start_date')
            ->get(['id', 'name'])
            ->map(fn (AcademicYear $schoolYear): array => [
                'id' => (int) $schoolYear->id,
                'name' => $schoolYear->name,
            ])
            ->all();
    }

    /**
     * @return array<int, array{id: number, name: string}>
     */
    private function classOptions(int $establishmentId, int $schoolYearId): array
    {
        return SchoolClass::query()
            ->where('establishment_id', $establishmentId)
            ->where('academic_year_id', $schoolYearId)
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn (SchoolClass $class): array => [
                'id' => (int) $class->id,
                'name' => $class->name,
            ])
            ->all();
    }
}
