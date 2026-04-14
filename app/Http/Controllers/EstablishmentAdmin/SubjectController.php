<?php

namespace App\Http\Controllers\EstablishmentAdmin;

use App\Http\Controllers\Controller;
use App\Http\Requests\EstablishmentAdmin\StoreSubjectRequest;
use App\Http\Requests\EstablishmentAdmin\UpdateSubjectRequest;
use App\Models\Subject;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SubjectController extends Controller
{
    public function index(Request $request): Response
    {
        $search = trim((string) $request->string('search'));

        $subjects = Subject::query()
            ->where('establishment_id', $this->establishmentId($request))
            ->when($search !== '', fn ($query) => $query->where('name', 'like', "%{$search}%"))
            ->orderBy('name')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('EstablishmentAdmin/Subjects/Index', [
            'filters' => ['search' => $search],
            'subjects' => $subjects,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('EstablishmentAdmin/Subjects/Create');
    }

    public function store(StoreSubjectRequest $request): RedirectResponse
    {
        Subject::create([
            ...$request->validated(),
            'establishment_id' => $this->establishmentId($request),
        ]);

        return redirect()
            ->route('establishment-admin.subjects.index')
            ->with('success', 'Subject created successfully.');
    }

    public function show(Request $request, Subject $subject): Response
    {
        $subject = $this->resolveSubject($request, $subject);

        return Inertia::render('EstablishmentAdmin/Subjects/Show', [
            'subject' => [
                'id' => $subject->id,
                'name' => $subject->name,
            ],
        ]);
    }

    public function edit(Request $request, Subject $subject): Response
    {
        $subject = $this->resolveSubject($request, $subject);

        return Inertia::render('EstablishmentAdmin/Subjects/Edit', [
            'subject' => [
                'id' => $subject->id,
                'name' => $subject->name,
            ],
        ]);
    }

    public function update(
        UpdateSubjectRequest $request,
        Subject $subject,
    ): RedirectResponse {
        $subject = $this->resolveSubject($request, $subject);
        $subject->update($request->validated());

        return redirect()
            ->route('establishment-admin.subjects.index')
            ->with('success', 'Subject updated successfully.');
    }

    public function destroy(
        Request $request,
        Subject $subject,
    ): RedirectResponse {
        $subject = $this->resolveSubject($request, $subject);

        try {
            $subject->delete();

            return redirect()
                ->route('establishment-admin.subjects.index')
                ->with('success', 'Subject deleted successfully.');
        } catch (\Throwable) {
            return redirect()
                ->route('establishment-admin.subjects.index')
                ->with('error', 'Subject could not be deleted.');
        }
    }

    private function establishmentId(Request $request): int
    {
        return (int) $request->user()->establishment_id;
    }

    private function resolveSubject(
        Request $request,
        Subject $subject,
    ): Subject {
        abort_unless(
            $subject->establishment_id === $this->establishmentId($request),
            403,
        );

        return $subject;
    }
}
