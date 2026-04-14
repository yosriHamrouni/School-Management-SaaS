<?php

namespace App\Http\Controllers\EstablishmentAdmin;

use App\Http\Controllers\Controller;
use App\Http\Requests\EstablishmentAdmin\StoreClassRequest;
use App\Http\Requests\EstablishmentAdmin\UpdateClassRequest;
use App\Models\AcademicYear;
use App\Models\Level;
use App\Models\SchoolClass;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ClassController extends Controller
{
    public function index(Request $request): Response
    {
        $search = trim((string) $request->string('search'));

        $classes = SchoolClass::query()
            ->with(['level:id,name', 'academicYear:id,name'])
            ->where('establishment_id', $this->establishmentId($request))
            ->when($search !== '', fn ($query) => $query->where('name', 'like', "%{$search}%"))
            ->orderBy('name')
            ->paginate(10)
            ->withQueryString()
            ->through(fn (SchoolClass $schoolClass) => [
                'id' => $schoolClass->id,
                'name' => $schoolClass->name,
                'level_name' => $schoolClass->level?->name,
                'academic_year_name' => $schoolClass->academicYear?->name,
            ]);

        return Inertia::render('EstablishmentAdmin/Classes/Index', [
            'filters' => ['search' => $search],
            'classes' => $classes,
        ]);
    }

    public function create(Request $request): Response
    {
        return Inertia::render('EstablishmentAdmin/Classes/Create', [
            'levels' => $this->levelOptions($request),
            'academicYears' => $this->academicYearOptions($request),
        ]);
    }

    public function store(StoreClassRequest $request): RedirectResponse
    {
        SchoolClass::create([
            ...$request->validated(),
            'establishment_id' => $this->establishmentId($request),
        ]);

        return redirect()
            ->route('establishment-admin.classes.index')
            ->with('success', 'Class created successfully.');
    }

    public function show(
        Request $request,
        SchoolClass $schoolClass,
    ): Response {
        $schoolClass = $this->resolveClass($request, $schoolClass);
        $schoolClass->load(['level:id,name', 'academicYear:id,name']);

        return Inertia::render('EstablishmentAdmin/Classes/Show', [
            'schoolClass' => [
                'id' => $schoolClass->id,
                'name' => $schoolClass->name,
                'level_name' => $schoolClass->level?->name,
                'academic_year_name' => $schoolClass->academicYear?->name,
            ],
        ]);
    }

    public function edit(
        Request $request,
        SchoolClass $schoolClass,
    ): Response {
        $schoolClass = $this->resolveClass($request, $schoolClass);

        return Inertia::render('EstablishmentAdmin/Classes/Edit', [
            'schoolClass' => [
                'id' => $schoolClass->id,
                'name' => $schoolClass->name,
                'level_id' => $schoolClass->level_id,
                'academic_year_id' => $schoolClass->academic_year_id,
            ],
            'levels' => $this->levelOptions($request),
            'academicYears' => $this->academicYearOptions($request),
        ]);
    }

    public function update(
        UpdateClassRequest $request,
        SchoolClass $schoolClass,
    ): RedirectResponse {
        $schoolClass = $this->resolveClass($request, $schoolClass);
        $schoolClass->update($request->validated());

        return redirect()
            ->route('establishment-admin.classes.index')
            ->with('success', 'Class updated successfully.');
    }

    public function destroy(
        Request $request,
        SchoolClass $schoolClass,
    ): RedirectResponse {
        $schoolClass = $this->resolveClass($request, $schoolClass);

        try {
            $schoolClass->delete();

            return redirect()
                ->route('establishment-admin.classes.index')
                ->with('success', 'Class deleted successfully.');
        } catch (\Throwable) {
            return redirect()
                ->route('establishment-admin.classes.index')
                ->with('error', 'Class could not be deleted.');
        }
    }

    private function establishmentId(Request $request): int
    {
        return (int) $request->user()->establishment_id;
    }

    private function resolveClass(
        Request $request,
        SchoolClass $schoolClass,
    ): SchoolClass {
        abort_unless(
            $schoolClass->establishment_id === $this->establishmentId($request),
            403,
        );

        return $schoolClass;
    }

    private function levelOptions(Request $request)
    {
        return Level::query()
            ->where('establishment_id', $this->establishmentId($request))
            ->orderBy('name')
            ->get(['id', 'name']);
    }

    private function academicYearOptions(Request $request)
    {
        return AcademicYear::query()
            ->where('establishment_id', $this->establishmentId($request))
            ->orderByDesc('start_date')
            ->get(['id', 'name']);
    }
}
