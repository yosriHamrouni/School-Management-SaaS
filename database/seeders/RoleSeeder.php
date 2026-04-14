<?php

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        foreach ([
            'platform_admin',
            'establishment_admin',
            'admin',
            'manager',
            'teacher',
            'student',
            'parent',
        ] as $roleName) {
            Role::updateOrCreate(['name' => $roleName]);
        }
    }
}
