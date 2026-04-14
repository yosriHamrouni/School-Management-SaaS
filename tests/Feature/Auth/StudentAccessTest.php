<?php

use App\Models\Role;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('student access screen can be rendered', function () {
    $this->get(route('student.access'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('StudentAccess')
            ->where('canResetPassword', true),
        );
});

test('student can authenticate through dedicated student access', function () {
    $student = User::factory()->create();
    attachStudentRole($student, 'student');

    $response = $this->post(route('student.access.store'), [
        'email' => $student->email,
        'password' => 'password',
        'remember' => true,
    ]);

    $this->assertAuthenticatedAs($student);
    $response->assertRedirect(route('dashboard', absolute: false));
});

test('non student cannot authenticate through dedicated student access', function () {
    $user = User::factory()->create();
    attachStudentRole($user, 'teacher');

    $response = $this->from(route('student.access'))->post(route('student.access.store'), [
        'email' => $user->email,
        'password' => 'password',
    ]);

    $response->assertRedirect(route('student.access'));
    $response->assertSessionHasErrors(['email']);
    $this->assertGuest();
});

test('authenticated student is redirected away from guest student access route', function () {
    $student = User::factory()->create();
    attachStudentRole($student, 'student');

    $this->actingAs($student)
        ->get(route('student.access'))
        ->assertRedirect(route('dashboard'));
});

function attachStudentRole(User $user, string $roleName): void
{
    $role = Role::firstOrCreate(['name' => $roleName]);
    $user->roles()->syncWithoutDetaching([$role->id]);
}
