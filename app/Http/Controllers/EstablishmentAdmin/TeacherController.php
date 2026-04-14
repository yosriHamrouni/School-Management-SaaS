<?php

namespace App\Http\Controllers\EstablishmentAdmin;

use App\Http\Controllers\Controller;
use App\Http\Requests\EstablishmentAdmin\StoreTeacherRequest;
use App\Http\Requests\EstablishmentAdmin\UpdateTeacherRequest;
use App\Models\SchoolClass;
use App\Models\Subject;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class TeacherController extends Controller
{
    public function index(Request $request): Response
    {
        $search = trim((string) $request->string('search'));

        $teachers = $this->teachersQuery($request)
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($subQuery) use ($search) {
                    $subQuery
                        ->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->orderBy('name')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('EstablishmentAdmin/Teachers/Index', [
            'filters' => ['search' => $search],
            'teachers' => $teachers->through(fn (User $teacher) => [
                'id' => $teacher->id,
                'name' => $teacher->name,
                'email' => $teacher->email,
                'assignments_count' => DB::table('class_subjects')
                    ->where('teacher_id', $teacher->id)
                    ->count(),
            ]),
        ]);
    }

    public function create(Request $request): Response
    {
        return Inertia::render('EstablishmentAdmin/Teachers/Create', [
            'assignmentOptions' => $this->assignmentOptions($request),
        ]);
    }

    public function store(StoreTeacherRequest $request): RedirectResponse
    {
        $role = $this->roleOrFail('teacher');
        $establishmentId = $this->establishmentId($request);
        $validated = $request->validated();

        DB::transaction(function () use ($validated, $role, $establishmentId) {
            $teacher = User::create([
                'establishment_id' => $establishmentId,
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => $validated['password'],
            ]);

            $teacher->roles()->attach($role->id);
            $this->syncAssignments($teacher->id, $validated['assignments'] ?? [], $establishmentId);
        });

        return redirect()
            ->route('establishment-admin.teachers.index')
            ->with('success', 'Teacher created successfully.');
    }

    public function show(Request $request, User $teacher): Response
    {
        $teacher = $this->resolveTeacher($request, $teacher);

        return Inertia::render('EstablishmentAdmin/Teachers/Show', [
            'teacher' => [
                'id' => $teacher->id,
                'name' => $teacher->name,
                'email' => $teacher->email,
                'role' => 'teacher',
                'assignments' => $this->teacherAssignments($teacher->id, $this->establishmentId($request)),
            ],
        ]);
    }

    public function edit(Request $request, User $teacher): Response
    {
        $teacher = $this->resolveTeacher($request, $teacher);

        return Inertia::render('EstablishmentAdmin/Teachers/Edit', [
            'teacher' => [
                'id' => $teacher->id,
                'name' => $teacher->name,
                'email' => $teacher->email,
                'assignments' => DB::table('class_subjects')
                    ->join('classes', 'classes.id', '=', 'class_subjects.class_id')
                    ->join('subjects', 'subjects.id', '=', 'class_subjects.subject_id')
                    ->where('teacher_id', $teacher->id)
                    ->where('classes.establishment_id', $this->establishmentId($request))
                    ->where('subjects.establishment_id', $this->establishmentId($request))
                    ->get()
                    ->map(fn ($assignment) => "{$assignment->class_id}:{$assignment->subject_id}")
                    ->all(),
            ],
            'assignmentOptions' => $this->assignmentOptions($request),
        ]);
    }

    public function update(
        UpdateTeacherRequest $request,
        User $teacher,
    ): RedirectResponse {
        $teacher = $this->resolveTeacher($request, $teacher);
        $validated = $request->validated();

        DB::transaction(function () use ($teacher, $validated, $request) {
            $teacher->fill([
                'name' => $validated['name'],
                'email' => $validated['email'],
            ]);

            if (! empty($validated['password'])) {
                $teacher->password = $validated['password'];
            }

            $teacher->save();

            $this->syncAssignments(
                $teacher->id,
                $validated['assignments'] ?? [],
                $this->establishmentId($request),
            );
        });

        return redirect()
            ->route('establishment-admin.teachers.index')
            ->with('success', 'Teacher updated successfully.');
    }

    public function destroy(Request $request, User $teacher): RedirectResponse
    {
        $teacher = $this->resolveTeacher($request, $teacher);

        DB::transaction(function () use ($teacher) {
            DB::table('class_subjects')
                ->where('teacher_id', $teacher->id)
                ->delete();
            $teacher->roles()->detach();
            $teacher->delete();
        });

        return redirect()
            ->route('establishment-admin.teachers.index')
            ->with('success', 'Teacher deleted successfully.');
    }

    private function teachersQuery(Request $request)
    {
        return User::query()
            ->where('establishment_id', $this->establishmentId($request))
            ->whereHas('roles', fn ($query) => $query->where('name', 'teacher'));
    }

    private function resolveTeacher(Request $request, User $teacher): User
    {
        abort_unless(
            $teacher->establishment_id === $this->establishmentId($request)
            && $teacher->hasRole('teacher'),
            403,
        );

        return $teacher;
    }

    private function establishmentId(Request $request): int
    {
        return (int) $request->user()->establishment_id;
    }

    private function roleOrFail(string $name): Role
    {
        return Role::firstOrCreate(['name' => $name]);
    }

    private function assignmentOptions(Request $request): array
    {
        $establishmentId = $this->establishmentId($request);
        $classes = SchoolClass::query()
            ->where('establishment_id', $establishmentId)
            ->orderBy('name')
            ->get(['id', 'name']);
        $subjects = Subject::query()
            ->where('establishment_id', $establishmentId)
            ->orderBy('name')
            ->get(['id', 'name']);

        return $classes->map(fn (SchoolClass $class) => [
            'class_id' => $class->id,
            'class_name' => $class->name,
            'subjects' => $subjects->map(fn (Subject $subject) => [
                'key' => "{$class->id}:{$subject->id}",
                'subject_id' => $subject->id,
                'subject_name' => $subject->name,
            ])->all(),
        ])->all();
    }

    private function syncAssignments(int $teacherId, array $assignments, int $establishmentId): void
    {
        DB::table('class_subjects')
            ->where('teacher_id', $teacherId)
            ->delete();

        $rows = collect($assignments)
            ->map(function (string $assignment) use ($teacherId, $establishmentId) {
                [$classId, $subjectId] = array_map('intval', explode(':', $assignment));

                $classExists = SchoolClass::query()
                    ->where('id', $classId)
                    ->where('establishment_id', $establishmentId)
                    ->exists();
                $subjectExists = Subject::query()
                    ->where('id', $subjectId)
                    ->where('establishment_id', $establishmentId)
                    ->exists();

                if (! $classExists || ! $subjectExists) {
                    return null;
                }

                return [
                    'class_id' => $classId,
                    'subject_id' => $subjectId,
                    'teacher_id' => $teacherId,
                ];
            })
            ->filter()
            ->unique(fn (array $row) => "{$row['class_id']}:{$row['subject_id']}")
            ->values()
            ->all();

        if ($rows !== []) {
            DB::table('class_subjects')->insert($rows);
        }
    }

    private function teacherAssignments(int $teacherId, int $establishmentId): array
    {
        return DB::table('class_subjects')
            ->join('classes', 'classes.id', '=', 'class_subjects.class_id')
            ->join('subjects', 'subjects.id', '=', 'class_subjects.subject_id')
            ->where('class_subjects.teacher_id', $teacherId)
            ->where('classes.establishment_id', $establishmentId)
            ->where('subjects.establishment_id', $establishmentId)
            ->orderBy('classes.name')
            ->orderBy('subjects.name')
            ->get(['classes.id as class_id', 'classes.name as class_name', 'subjects.id as subject_id', 'subjects.name as subject_name'])
            ->groupBy('class_id')
            ->map(function ($rows) {
                $first = $rows->first();

                return [
                    'class_id' => (int) $first->class_id,
                    'class_name' => $first->class_name,
                    'subjects' => $rows->map(fn ($row) => [
                        'subject_id' => (int) $row->subject_id,
                        'subject_name' => $row->subject_name,
                    ])->values()->all(),
                ];
            })
            ->values()
            ->all();
    }
}
