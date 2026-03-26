<?php

namespace App\Http\Controllers;

use App\Concerns\PasswordValidationRules;
use App\Models\Establishment;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class UserManagementController extends Controller
{
    use PasswordValidationRules;

    public function index(): Response
    {
        $users = User::query()
            ->with(['establishment:id,name', 'roles:id,name'])
            ->select(['id', 'name', 'email', 'establishment_id'])
            ->orderBy('name')
            ->get()
            ->map(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'establishment' => $user->establishment?->name,
                'establishment_id' => $user->establishment_id,
                'roles' => $user->roles->pluck('name')->values(),
                'role_ids' => $user->roles->pluck('id')->values(),
            ]);

        return Inertia::render('users/index', [
            'users' => $users,
            'establishments' => Establishment::query()
                ->select(['id', 'name'])
                ->orderBy('name')
                ->get(),
            'roles' => Role::query()
                ->select(['id', 'name'])
                ->orderBy('name')
                ->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => $this->passwordRules(),
            'establishment_id' => ['nullable', 'integer', Rule::exists('establishments', 'id')],
            'role_ids' => ['nullable', 'array'],
            'role_ids.*' => ['integer', Rule::exists('roles', 'id')],
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => $validated['password'],
            'establishment_id' => $validated['establishment_id'] ?? null,
        ]);

        $user->roles()->sync($validated['role_ids'] ?? []);

        return redirect()
            ->route('users.index')
            ->with('success', 'Utilisateur cree avec succes.');
    }

    public function update(Request $request, User $user): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($user->id),
            ],
            'password' => ['nullable', 'string', ...array_slice($this->passwordRules(), 2)],
            'establishment_id' => ['nullable', 'integer', Rule::exists('establishments', 'id')],
            'role_ids' => ['nullable', 'array'],
            'role_ids.*' => ['integer', Rule::exists('roles', 'id')],
        ]);

        $user->fill([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'establishment_id' => $validated['establishment_id'] ?? null,
        ]);

        if (! empty($validated['password'])) {
            $user->password = $validated['password'];
        }

        $user->save();
        $user->roles()->sync($validated['role_ids'] ?? []);

        return redirect()
            ->route('users.index')
            ->with('success', 'Utilisateur modifie avec succes.');
    }

    public function destroy(User $user): RedirectResponse
    {
        $user->roles()->detach();
        $user->delete();

        return redirect()
            ->route('users.index')
            ->with('success', 'Utilisateur supprime avec succes.');
    }
}
