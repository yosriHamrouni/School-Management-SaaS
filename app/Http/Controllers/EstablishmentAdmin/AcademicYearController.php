<?php

namespace App\Http\Controllers\EstablishmentAdmin;

use App\Http\Controllers\Controller;
use App\Http\Requests\EstablishmentAdmin\StoreAcademicYearRequest;
use App\Http\Requests\EstablishmentAdmin\UpdateAcademicYearRequest;
use App\Models\AcademicYear;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class AcademicYearController extends Controller
{
    public function index(Request $request): Response
    {
        $search = trim((string) $request->string('search'));
        $establishmentId = $this->establishmentId($request);

        $academicYears = AcademicYear::query()
            ->where('establishment_id', $establishmentId)
            ->when($search !== '', function ($query) use ($search) {
                $query->where('name', 'like', "%{$search}%");
            })
            ->orderByDesc('start_date')
            ->paginate(10)
            ->withQueryString()
            ->through(fn (AcademicYear $academicYear) => [
                'id' => $academicYear->id,
                'name' => $academicYear->name,
                'start_date' => $academicYear->start_date?->format('Y-m-d'),
                'end_date' => $academicYear->end_date?->format('Y-m-d'),
                'status' => $academicYear->status,
                'is_current' => $academicYear->is_current,
            ]);

        return Inertia::render('EstablishmentAdmin/AcademicYears/Index', [
            'filters' => [
                'search' => $search,
            ],
            'academicYears' => $academicYears,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('EstablishmentAdmin/AcademicYears/Create');
    }

    public function store(
        StoreAcademicYearRequest $request,
    ): RedirectResponse {
        $establishmentId = $this->establishmentId($request);
        $validated = $request->validated();

        DB::transaction(function () use ($validated, $establishmentId) {
            if ($validated['is_current']) {
                $this->clearCurrentAcademicYear($establishmentId);
            }

            AcademicYear::create([
                ...$validated,
                'establishment_id' => $establishmentId,
            ]);
        });

        return redirect()
            ->route('establishment-admin.academic-years.index')
            ->with('success', 'Academic year created successfully.');
    }

    public function show(Request $request, AcademicYear $academicYear): Response
    {
        $academicYear = $this->resolveAcademicYear($request, $academicYear);

        return Inertia::render('EstablishmentAdmin/AcademicYears/Show', [
            'academicYear' => $this->academicYearPayload($academicYear),
        ]);
    }

    public function edit(Request $request, AcademicYear $academicYear): Response
    {
        $academicYear = $this->resolveAcademicYear($request, $academicYear);

        return Inertia::render('EstablishmentAdmin/AcademicYears/Edit', [
            'academicYear' => $this->academicYearPayload($academicYear),
        ]);
    }

    public function update(
        UpdateAcademicYearRequest $request,
        AcademicYear $academicYear,
    ): RedirectResponse {
        $academicYear = $this->resolveAcademicYear($request, $academicYear);
        $validated = $request->validated();

        DB::transaction(function () use ($academicYear, $validated) {
            if ($validated['is_current']) {
                $this->clearCurrentAcademicYear(
                    $academicYear->establishment_id,
                    $academicYear->id,
                );
            }

            $academicYear->update($validated);
        });

        return redirect()
            ->route('establishment-admin.academic-years.index')
            ->with('success', 'Academic year updated successfully.');
    }

    public function destroy(
        Request $request,
        AcademicYear $academicYear,
    ): RedirectResponse {
        $academicYear = $this->resolveAcademicYear($request, $academicYear);

        try {
            $academicYear->delete();

            return redirect()
                ->route('establishment-admin.academic-years.index')
                ->with('success', 'Academic year deleted successfully.');
        } catch (\Throwable) {
            return redirect()
                ->route('establishment-admin.academic-years.index')
                ->with('error', 'Academic year could not be deleted.');
        }
    }

    private function establishmentId(Request $request): int
    {
        $establishmentId = $request->user()?->establishment_id;

        abort_unless($establishmentId, 403);

        return (int) $establishmentId;
    }

    private function resolveAcademicYear(
        Request $request,
        AcademicYear $academicYear,
    ): AcademicYear {
        abort_unless(
            $academicYear->establishment_id === $this->establishmentId($request),
            404,
        );

        return $academicYear;
    }

    private function clearCurrentAcademicYear(
        int $establishmentId,
        ?int $exceptId = null,
    ): void {
        AcademicYear::query()
            ->where('establishment_id', $establishmentId)
            ->when(
                $exceptId,
                fn ($query) => $query->whereKeyNot($exceptId),
            )
            ->update(['is_current' => false]);
    }

    private function academicYearPayload(AcademicYear $academicYear): array
    {
        return [
            'id' => $academicYear->id,
            'name' => $academicYear->name,
            'start_date' => $academicYear->start_date?->format('Y-m-d'),
            'end_date' => $academicYear->end_date?->format('Y-m-d'),
            'status' => $academicYear->status,
            'is_current' => $academicYear->is_current,
            'created_at' => $academicYear->created_at?->toDateTimeString(),
            'updated_at' => $academicYear->updated_at?->toDateTimeString(),
        ];
    }
}
