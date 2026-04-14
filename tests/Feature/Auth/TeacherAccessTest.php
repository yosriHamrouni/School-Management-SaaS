<?php

use App\Models\Role;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('teacher access screen can be rendered', function () {
    $this->get(route('teacher.access'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('TeacherAccess')
            ->where('canResetPassword', true),
        );
});

test('teacher can authenticate through dedicated teacher access', function () {
    $teacher = User::factory()->create();
    attachRole($teacher, 'teacher');

    $response = $this->post(route('teacher.access.store'), [
        'email' => $teacher->email,
        'password' => 'password',
        'remember' => true,
    ]);

    $this->assertAuthenticatedAs($teacher);
    $response->assertRedirect(route('dashboard', absolute: false));
});

test('non teacher cannot authenticate through dedicated teacher access', function () {
    $user = User::factory()->create();
    attachRole($user, 'student');

    $response = $this->from(route('teacher.access'))->post(route('teacher.access.store'), [
        'email' => $user->email,
        'password' => 'password',
    ]);

    $response->assertRedirect(route('teacher.access'));
    $response->assertSessionHasErrors(['email']);
    $this->assertGuest();
});

test('authenticated teacher is redirected away from guest teacher access route', function () {
    $teacher = User::factory()->create();
    attachRole($teacher, 'teacher');

    $this->actingAs($teacher)
        ->get(route('teacher.access'))
        ->assertRedirect(route('dashboard'));
});

function attachRole(User $user, string $roleName): void
{
    $role = Role::firstOrCreate(['name' => $roleName]);
    $user->roles()->syncWithoutDetaching([$role->id]);
}
