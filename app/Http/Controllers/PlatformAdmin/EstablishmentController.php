<?php

namespace App\Http\Controllers\PlatformAdmin;

use App\Http\Controllers\Controller;
use App\Http\Requests\PlatformAdmin\StoreEstablishmentRequest;
use App\Http\Requests\PlatformAdmin\UpdateEstablishmentRequest;
use App\Models\Establishment;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EstablishmentController extends Controller
{
    public function index(Request $request): Response
    {
        $search = trim((string) $request->string('search'));

        $establishments = Establishment::query()
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($subQuery) use ($search) {
                    $subQuery
                        ->where('name', 'like', "%{$search}%")
                        ->orWhere('code', 'like', "%{$search}%");
                });
            })
            ->latest()
            ->paginate(10)
            ->withQueryString()
            ->through(fn (Establishment $establishment) => [
                'id' => $establishment->id,
                'name' => $establishment->name,
                'code' => $establishment->code,
                'type' => $establishment->type,
                'city' => $establishment->city,
                'phone' => $establishment->phone,
                'email' => $establishment->email,
                'director_name' => $establishment->director_name,
                'is_active' => $establishment->is_active,
                'created_at' => $establishment->created_at?->toDateTimeString(),
            ]);

        return Inertia::render('PlatformAdmin/Establishments/Index', [
            'filters' => [
                'search' => $search,
            ],
            'establishments' => $establishments,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('PlatformAdmin/Establishments/Create');
    }

    public function store(StoreEstablishmentRequest $request): RedirectResponse
    {
        Establishment::create($request->validated());

        return redirect()
            ->route('platform-admin.establishments.index')
            ->with('success', 'Establishment created successfully.');
    }

    public function show(Establishment $establishment): Response
    {
        return Inertia::render('PlatformAdmin/Establishments/Show', [
            'establishment' => [
                'id' => $establishment->id,
                'name' => $establishment->name,
                'code' => $establishment->code,
                'type' => $establishment->type,
                'address' => $establishment->address,
                'city' => $establishment->city,
                'phone' => $establishment->phone,
                'email' => $establishment->email,
                'director_name' => $establishment->director_name,
                'is_active' => $establishment->is_active,
                'created_at' => $establishment->created_at?->toDateTimeString(),
                'updated_at' => $establishment->updated_at?->toDateTimeString(),
            ],
        ]);
    }

    public function edit(Establishment $establishment): Response
    {
        return Inertia::render('PlatformAdmin/Establishments/Edit', [
            'establishment' => [
                'id' => $establishment->id,
                'name' => $establishment->name,
                'code' => $establishment->code,
                'type' => $establishment->type,
                'address' => $establishment->address,
                'city' => $establishment->city,
                'phone' => $establishment->phone,
                'email' => $establishment->email,
                'director_name' => $establishment->director_name,
                'is_active' => $establishment->is_active,
            ],
        ]);
    }

    public function update(
        UpdateEstablishmentRequest $request,
        Establishment $establishment,
    ): RedirectResponse {
        $establishment->update($request->validated());

        return redirect()
            ->route('platform-admin.establishments.index')
            ->with('success', 'Establishment updated successfully.');
    }

    public function destroy(Establishment $establishment): RedirectResponse
    {
        $establishment->delete();

        return redirect()
            ->route('platform-admin.establishments.index')
            ->with('success', 'Establishment deleted successfully.');
    }

    public function toggleStatus(Establishment $establishment): RedirectResponse
    {
        $establishment->update([
            'is_active' => ! $establishment->is_active,
        ]);

        return redirect()
            ->back()
            ->with(
                'success',
                $establishment->is_active
                    ? 'Establishment activated successfully.'
                    : 'Establishment deactivated successfully.'
            );
    }
}
