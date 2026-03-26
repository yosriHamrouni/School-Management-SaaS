<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Seeder;

class PermissionSeeder extends Seeder
{
    public function run(): void
    {
        $permissions = [
            'full_platform_access',
            'manage_users',
            'manage_roles',
            'manage_establishments',
            'view_dashboard',
            'manage_classes',
            'manage_students',
            'manage_grades',
            'view_children',
        ];

        foreach ($permissions as $permissionName) {
            Permission::updateOrCreate(['name' => $permissionName]);
        }

        $rolePermissions = [
            'platform_admin' => Permission::pluck('id')->all(),
            'admin' => Permission::whereIn('name', [
                'manage_users',
                'manage_roles',
                'manage_establishments',
                'view_dashboard',
                'manage_classes',
                'manage_students',
                'manage_grades',
            ])->pluck('id')->all(),
            'manager' => Permission::whereIn('name', [
                'view_dashboard',
                'manage_classes',
                'manage_students',
                'manage_grades',
            ])->pluck('id')->all(),
            'teacher' => Permission::whereIn('name', [
                'view_dashboard',
                'manage_grades',
            ])->pluck('id')->all(),
            'student' => Permission::whereIn('name', [
                'view_dashboard',
            ])->pluck('id')->all(),
            'parent' => Permission::whereIn('name', [
                'view_dashboard',
                'view_children',
            ])->pluck('id')->all(),
        ];

        foreach ($rolePermissions as $roleName => $permissionIds) {
            $role = Role::where('name', $roleName)->first();

            if ($role !== null) {
                $role->permissions()->sync($permissionIds);
            }
        }
    }
}
