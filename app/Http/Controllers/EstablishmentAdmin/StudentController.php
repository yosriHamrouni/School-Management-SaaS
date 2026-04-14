<?php

namespace App\Http\Controllers\EstablishmentAdmin;

use App\Http\Controllers\Controller;
use App\Http\Requests\EstablishmentAdmin\StoreStudentRequest;
use App\Http\Requests\EstablishmentAdmin\UpdateStudentRequest;
use App\Models\Role;
use App\Models\SchoolClass;
use App\Models\StudentProfile;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;

class StudentController extends Controller
{
    public function index(Request $request): Response
    {
        $search = trim((string) $request->string('search'));

        $students = $this->studentsQuery($request)
            ->with('studentProfile.schoolClass')
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
            ->through(fn (User $student) => [
                'id' => $student->id,
                'name' => $student->name,
                'email' => $student->email,
                'student_number' => $student->studentProfile?->student_number,
                'class_name' => $student->studentProfile?->schoolClass?->name,
                'status' => $student->studentProfile?->status,
            ]);

        return Inertia::render('EstablishmentAdmin/Students/Index', [
            'filters' => ['search' => $search],
            'students' => $students,
        ]);
    }

    public function create(Request $request): Response
    {
        return Inertia::render('EstablishmentAdmin/Students/Create', [
            'classes' => $this->classOptions($request),
        ]);
    }

    public function store(StoreStudentRequest $request): RedirectResponse
    {
        $role = $this->roleOrFail('student');
        $establishmentId = $this->establishmentId($request);
        $validated = $request->validated();

        DB::transaction(function () use ($validated, $role, $establishmentId) {
            $student = User::create([
                'establishment_id' => $establishmentId,
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => $validated['password'],
            ]);

            $student->roles()->attach($role->id);

            $profile = StudentProfile::create([
                'user_id' => $student->id,
                'establishment_id' => $establishmentId,
                'class_id' => $validated['class_id'] ?? null,
                'student_number' => $validated['student_number'],
                'date_of_birth' => $validated['date_of_birth'] ?? null,
                'gender' => $validated['gender'] ?? null,
                'enrollment_date' => $validated['enrollment_date'] ?? null,
                'status' => $validated['status'] ?? null,
                'photo_url' => $validated['photo_url'] ?? null,
            ]);

            $this->syncClassStudentMembership($student->id, $profile->class_id);
        });

        return redirect()
            ->route('establishment-admin.students.index')
            ->with('success', 'Student created successfully.');
    }

    public function show(Request $request, User $student): Response
    {
        $student = $this->resolveStudent($request, $student);
        $student->load('studentProfile.schoolClass');

        return Inertia::render('EstablishmentAdmin/Students/Show', [
            'student' => [
                'id' => $student->id,
                'name' => $student->name,
                'email' => $student->email,
                'class_name' => $student->studentProfile?->schoolClass?->name,
                'student_number' => $student->studentProfile?->student_number,
                'date_of_birth' => $student->studentProfile?->date_of_birth?->format('Y-m-d'),
                'gender' => $student->studentProfile?->gender,
                'enrollment_date' => $student->studentProfile?->enrollment_date?->format('Y-m-d'),
                'status' => $student->studentProfile?->status,
                'photo_url' => $student->studentProfile?->photo_url,
                'role' => 'student',
            ],
        ]);
    }

    public function edit(Request $request, User $student): Response
    {
        $student = $this->resolveStudent($request, $student);
        $student->load('studentProfile');

        return Inertia::render('EstablishmentAdmin/Students/Edit', [
            'student' => [
                'id' => $student->id,
                'name' => $student->name,
                'email' => $student->email,
                'class_id' => $student->studentProfile?->class_id,
                'student_number' => $student->studentProfile?->student_number,
                'date_of_birth' => $student->studentProfile?->date_of_birth?->format('Y-m-d'),
                'gender' => $student->studentProfile?->gender,
                'enrollment_date' => $student->studentProfile?->enrollment_date?->format('Y-m-d'),
                'status' => $student->studentProfile?->status,
                'photo_url' => $student->studentProfile?->photo_url,
            ],
            'classes' => $this->classOptions($request),
        ]);
    }

    public function update(
        UpdateStudentRequest $request,
        User $student,
    ): RedirectResponse {
        $student = $this->resolveStudent($request, $student);
        $student->load('studentProfile');
        $validated = $request->validated();

        DB::transaction(function () use ($student, $validated) {
            $student->fill([
                'name' => $validated['name'],
                'email' => $validated['email'],
            ]);

            if (! empty($validated['password'])) {
                $student->password = $validated['password'];
            }

            $student->save();

            $student->studentProfile()->update([
                'class_id' => $validated['class_id'] ?? null,
                'student_number' => $validated['student_number'],
                'date_of_birth' => $validated['date_of_birth'] ?? null,
                'gender' => $validated['gender'] ?? null,
                'enrollment_date' => $validated['enrollment_date'] ?? null,
                'status' => $validated['status'] ?? null,
                'photo_url' => $validated['photo_url'] ?? null,
            ]);

            $this->syncClassStudentMembership($student->id, $validated['class_id'] ?? null);
        });

        return redirect()
            ->route('establishment-admin.students.index')
            ->with('success', 'Student updated successfully.');
    }

    public function destroy(Request $request, User $student): RedirectResponse
    {
        $student = $this->resolveStudent($request, $student);
        $student->load('studentProfile');

        DB::transaction(function () use ($student) {
            $profile = $student->studentProfile;

            if ($profile) {
                $profile->parents()->detach();
                $profile->delete();
            }

            $this->syncClassStudentMembership($student->id, null);

            $student->roles()->detach();
            $student->delete();
        });

        return redirect()
            ->route('establishment-admin.students.index')
            ->with('success', 'Student deleted successfully.');
    }

    private function studentsQuery(Request $request)
    {
        return User::query()
            ->where('establishment_id', $this->establishmentId($request))
            ->whereHas('roles', fn ($query) => $query->where('name', 'student'));
    }

    private function resolveStudent(Request $request, User $student): User
    {
        abort_unless(
            $student->establishment_id === $this->establishmentId($request)
            && $student->hasRole('student'),
            403,
        );

        return $student;
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

    private function classOptions(Request $request)
    {
        return SchoolClass::query()
            ->where('establishment_id', $this->establishmentId($request))
            ->orderBy('name')
            ->get(['id', 'name']);
    }

    private function syncClassStudentMembership(int $studentId, ?int $classId): void
    {
        if (! Schema::hasTable('class_students')) {
            return;
        }

        DB::table('class_students')
            ->where('student_id', $studentId)
            ->delete();

        if ($classId === null) {
            return;
        }

        DB::table('class_students')->insert([
            'class_id' => $classId,
            'student_id' => $studentId,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
