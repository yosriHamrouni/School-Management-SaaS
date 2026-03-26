<?php

namespace Database\Seeders;

use App\Models\Establishment;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        $establishment = Establishment::firstOrFail();

        $admin = User::updateOrCreate(
            ['email' => 'admin@school-management.test'],
            [
                'establishment_id' => $establishment->id,
                'name' => 'System Administrator',
                'password' => Hash::make('password'),
            ],
        );

        $adminRoles = Role::whereIn('name', ['platform_admin', 'admin'])
            ->pluck('id')
            ->all();

        if ($adminRoles !== []) {
            $admin->roles()->syncWithoutDetaching($adminRoles);
        }
    }
}
