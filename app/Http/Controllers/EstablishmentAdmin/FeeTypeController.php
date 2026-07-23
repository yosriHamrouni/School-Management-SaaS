<?php

namespace App\Http\Controllers\EstablishmentAdmin;

use App\Http\Controllers\Controller;
use App\Http\Requests\EstablishmentAdmin\StoreFeeTypeRequest;
use App\Http\Requests\EstablishmentAdmin\UpdateFeeTypeRequest;
use App\Models\FeeType;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class FeeTypeController extends Controller
{
    public function index(Request $request): Response
    {
        $search = trim((string) $request->string('search'));

        $feeTypes = FeeType::query()
            ->where('establishment_id', $this->establishmentId($request))
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($query) use ($search) {
                    $query->where('name', 'like', "%{$search}%")
                        ->orWhere('type', 'like', "%{$search}%");
                });
            })
            ->orderByDesc('is_active')
            ->orderBy('name')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('Finance/FeeTypes/Index', [
            'filters' => ['search' => $search],
            'feeTypes' => $feeTypes,
            'options' => [
                'types' => FeeType::TYPES,
                'frequencies' => FeeType::FREQUENCIES,
            ],
        ]);
    }

    public function store(StoreFeeTypeRequest $request): RedirectResponse
    {
        FeeType::create([
            ...$request->validated(),
            'is_active' => $request->boolean('is_active', true),
            'establishment_id' => $this->establishmentId($request),
        ]);

        return redirect()
            ->route('finance.fee-types.index')
            ->with('success', 'Frais scolaire cree avec succes.');
    }

    public function update(
        UpdateFeeTypeRequest $request,
        FeeType $feeType,
    ): RedirectResponse {
        $feeType = $this->resolveFeeType($request, $feeType);

        $feeType->update([
            ...$request->validated(),
            'is_active' => $request->boolean('is_active'),
        ]);

        return redirect()
            ->route('finance.fee-types.index')
            ->with('success', 'Frais scolaire mis a jour avec succes.');
    }

    public function destroy(Request $request, FeeType $feeType): RedirectResponse
    {
        $feeType = $this->resolveFeeType($request, $feeType);
        $feeType->update(['is_active' => false]);

        return redirect()
            ->route('finance.fee-types.index')
            ->with('success', 'Frais scolaire desactive avec succes.');
    }

    private function establishmentId(Request $request): int
    {
        return (int) $request->user()->establishment_id;
    }

    private function resolveFeeType(Request $request, FeeType $feeType): FeeType
    {
        abort_unless(
            $feeType->establishment_id === $this->establishmentId($request),
            403,
        );

        return $feeType;
    }
}
