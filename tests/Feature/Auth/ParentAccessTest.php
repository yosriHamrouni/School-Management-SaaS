<?php

use App\Models\Role;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('parent access screen can be rendered', function () {
    $this->get(route('parent.access'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('ParentAccess')
            ->where('canResetPassword', true),
        );
});

test('parent can authenticate through dedicated parent access', function () {
    $parent = User::factory()->create();
    attachParentRole($parent, 'parent');

    $response = $this->post(route('parent.access.store'), [
        'email' => $parent->email,
        'password' => 'password',
        'remember' => true,
    ]);

    $this->assertAuthenticatedAs($parent);
    $response->assertRedirect(route('dashboard', absolute: false));
});

test('non parent cannot authenticate through dedicated parent access', function () {
    $user = User::factory()->create();
    attachParentRole($user, 'student');

    $response = $this->from(route('parent.access'))->post(route('parent.access.store'), [
        'email' => $user->email,
        'password' => 'password',
    ]);

    $response->assertRedirect(route('parent.access'));
    $response->assertSessionHasErrors(['email']);
    $this->assertGuest();
});

test('authenticated parent is redirected away from guest parent access route', function () {
    $parent = User::factory()->create();
    attachParentRole($parent, 'parent');

    $this->actingAs($parent)
        ->get(route('parent.access'))
        ->assertRedirect(route('dashboard'));
});

function attachParentRole(User $user, string $roleName): void
{
    $role = Role::firstOrCreate(['name' => $roleName]);
    $user->roles()->syncWithoutDetaching([$role->id]);
}
