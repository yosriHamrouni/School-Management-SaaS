<?php

namespace App\Http\Controllers\EstablishmentAdmin;

use App\Http\Controllers\Controller;
use App\Http\Requests\EstablishmentAdmin\AssignStudentToParentRequest;
use App\Http\Requests\EstablishmentAdmin\StoreParentRequest;
use App\Http\Requests\EstablishmentAdmin\UpdateParentRequest;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ParentController extends Controller
{
    public function index(Request $request): Response
    {
        $search = trim((string) $request->string('search'));

        $parents = $this->parentsQuery($request)
            ->with('children')
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($subQuery) use ($search) {
                    $subQuery
                        ->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->orderBy('name')
            ->paginate(10)
            ->withQueryString()
            ->through(fn (User $parent) => [
                'id' => $parent->id,
                'name' => $parent->name,
                'email' => $parent->email,
                'linked_students_count' => $parent->children->count(),
            ]);

        return Inertia::render('EstablishmentAdmin/Parents/Index', [
            'filters' => ['search' => $search],
            'parents' => $parents,
        ]);
    }

    public function create(Request $request): Response
    {
        return Inertia::render('EstablishmentAdmin/Parents/Create', [
            'students' => $this->studentOptions($request),
        ]);
    }

    public function store(StoreParentRequest $request): RedirectResponse
    {
        $role = $this->roleOrFail('parent');
        $establishmentId = $this->establishmentId($request);
        $validated = $request->validated();

        DB::transaction(function () use ($validated, $role, $establishmentId) {
            $parent = User::create([
                'establishment_id' => $establishmentId,
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => $validated['password'],
            ]);

            $parent->roles()->attach($role->id);

            $this->syncParentChildren($parent, $validated['student_ids'] ?? []);
        });

        return redirect()
            ->route('establishment-admin.parents.index')
            ->with('success', 'Parent created successfully.');
    }

    public function show(Request $request, User $parent): Response
    {
        $parent = $this->resolveParent($request, $parent);
        $parent->load('children.user');

        return Inertia::render('EstablishmentAdmin/Parents/Show', [
            'parent' => [
                'id' => $parent->id,
                'name' => $parent->name,
                'email' => $parent->email,
                'role' => 'parent',
                'students' => $parent->children->map(fn ($profile) => [
                    'id' => $profile->user?->id,
                    'name' => $profile->user?->name,
                    'student_number' => $profile->student_number,
                ])->values(),
            ],
        ]);
    }

    public function edit(Request $request, User $parent): Response
    {
        $parent = $this->resolveParent($request, $parent);
        $parent->load('children');

        return Inertia::render('EstablishmentAdmin/Parents/Edit', [
            'parent' => [
                'id' => $parent->id,
                'name' => $parent->name,
                'email' => $parent->email,
                'student_ids' => $parent->children->pluck('user_id')->values(),
            ],
            'students' => $this->studentOptions($request),
        ]);
    }

    public function update(
        UpdateParentRequest $request,
        User $parent,
    ): RedirectResponse {
        $parent = $this->resolveParent($request, $parent);
        $validated = $request->validated();

        DB::transaction(function () use ($parent, $validated) {
            $parent->fill([
                'name' => $validated['name'],
                'email' => $validated['email'],
            ]);

            if (! empty($validated['password'])) {
                $parent->password = $validated['password'];
            }

            $parent->save();

            $this->syncParentChildren($parent, $validated['student_ids'] ?? []);
        });

        return redirect()
            ->route('establishment-admin.parents.index')
            ->with('success', 'Parent updated successfully.');
    }

    public function assignStudent(
        AssignStudentToParentRequest $request,
        User $parent,
    ): RedirectResponse {
        $parent = $this->resolveParent($request, $parent);
        $studentProfileIds = $this->studentProfilesForUserIds(
            $parent->establishment_id,
            [$request->integer('student_id')],
        );

        abort_if($studentProfileIds === [], 422, 'Student profile not found.');

        $parent->children()->syncWithoutDetaching($studentProfileIds);

        return redirect()
            ->back()
            ->with('success', 'Student assigned to parent successfully.');
    }

    public function destroy(Request $request, User $parent): RedirectResponse
    {
        $parent = $this->resolveParent($request, $parent);

        DB::transaction(function () use ($parent) {
            $parent->children()->detach();
            $parent->roles()->detach();
            $parent->delete();
        });

        return redirect()
            ->route('establishment-admin.parents.index')
            ->with('success', 'Parent deleted successfully.');
    }

    private function parentsQuery(Request $request)
    {
        return User::query()
            ->where('establishment_id', $this->establishmentId($request))
            ->whereHas('roles', fn ($query) => $query->where('name', 'parent'));
    }

    private function studentOptions(Request $request)
    {
        return User::query()
            ->where('establishment_id', $this->establishmentId($request))
            ->whereHas('roles', fn ($query) => $query->where('name', 'student'))
            ->with('studentProfile')
            ->orderBy('name')
            ->get()
            ->map(fn (User $student) => [
                'id' => $student->id,
                'name' => $student->name,
                'student_number' => $student->studentProfile?->student_number,
            ])
            ->values();
    }

    private function syncParentChildren(User $parent, array $studentUserIds): void
    {
        $studentProfileIds = $this->studentProfilesForUserIds(
            $parent->establishment_id,
            $studentUserIds,
        );

        $parent->children()->sync($studentProfileIds);
    }

    private function studentProfilesForUserIds(int $establishmentId, array $studentUserIds): array
    {
        if ($studentUserIds === []) {
            return [];
        }

        return DB::table('student_profiles')
            ->join('role_user', 'role_user.user_id', '=', 'student_profiles.user_id')
            ->join('roles', 'roles.id', '=', 'role_user.role_id')
            ->where('student_profiles.establishment_id', $establishmentId)
            ->whereIn('student_profiles.user_id', $studentUserIds)
            ->where('roles.name', 'student')
            ->pluck('student_profiles.id')
            ->all();
    }

    private function resolveParent(Request $request, User $parent): User
    {
        abort_unless(
            $parent->establishment_id === $this->establishmentId($request)
            && $parent->hasRole('parent'),
            403,
        );

        return $parent;
    }

    private function establishmentId(Request $request): int
    {
        return (int) $request->user()->establishment_id;
    }

    private function roleOrFail(string $name): Role
    {
        return Role::query()
            ->where('name', $name)
            ->firstOrFail();
    }
}
