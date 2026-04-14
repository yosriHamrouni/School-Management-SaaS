<?php

namespace App\Http\Controllers\EstablishmentAdmin;

use App\Http\Controllers\Controller;
use App\Http\Requests\EstablishmentAdmin\StoreLevelRequest;
use App\Http\Requests\EstablishmentAdmin\UpdateLevelRequest;
use App\Models\Level;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LevelController extends Controller
{
    public function index(Request $request): Response
    {
        $search = trim((string) $request->string('search'));

        $levels = Level::query()
            ->where('establishment_id', $this->establishmentId($request))
            ->when($search !== '', fn ($query) => $query->where('name', 'like', "%{$search}%"))
            ->orderBy('name')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('EstablishmentAdmin/Levels/Index', [
            'filters' => ['search' => $search],
            'levels' => $levels,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('EstablishmentAdmin/Levels/Create');
    }

    public function store(StoreLevelRequest $request): RedirectResponse
    {
        Level::create([
            ...$request->validated(),
            'establishment_id' => $this->establishmentId($request),
        ]);

        return redirect()
            ->route('establishment-admin.levels.index')
            ->with('success', 'Level created successfully.');
    }

    public function show(Request $request, Level $level): Response
    {
        $level = $this->resolveLevel($request, $level);

        return Inertia::render('EstablishmentAdmin/Levels/Show', [
            'level' => [
                'id' => $level->id,
                'name' => $level->name,
            ],
        ]);
    }

    public function edit(Request $request, Level $level): Response
    {
        $level = $this->resolveLevel($request, $level);

        return Inertia::render('EstablishmentAdmin/Levels/Edit', [
            'level' => [
                'id' => $level->id,
                'name' => $level->name,
            ],
        ]);
    }

    public function update(
        UpdateLevelRequest $request,
        Level $level,
    ): RedirectResponse {
        $level = $this->resolveLevel($request, $level);
        $level->update($request->validated());

        return redirect()
            ->route('establishment-admin.levels.index')
            ->with('success', 'Level updated successfully.');
    }

    public function destroy(Request $request, Level $level): RedirectResponse
    {
        $level = $this->resolveLevel($request, $level);

        try {
            $level->delete();

            return redirect()
                ->route('establishment-admin.levels.index')
                ->with('success', 'Level deleted successfully.');
        } catch (\Throwable) {
            return redirect()
                ->route('establishment-admin.levels.index')
                ->with('error', 'Level could not be deleted.');
        }
    }

    private function establishmentId(Request $request): int
    {
        return (int) $request->user()->establishment_id;
    }

    private function resolveLevel(Request $request, Level $level): Level
    {
        abort_unless(
            $level->establishment_id === $this->establishmentId($request),
            403,
        );

        return $level;
    }
}
