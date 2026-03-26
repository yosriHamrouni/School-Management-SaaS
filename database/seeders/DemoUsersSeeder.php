<?php

namespace Database\Seeders;

use App\Models\Establishment;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DemoUsersSeeder extends Seeder
{
    public function run(): void
    {
        $establishment = Establishment::firstOrFail();

        $users = [
            [
                'name' => 'Platform Admin Demo',
                'email' => 'platform-admin@school-management.test',
                'role' => 'platform_admin',
            ],
            [
                'name' => 'Teacher Demo',
                'email' => 'teacher@school-management.test',
                'role' => 'teacher',
            ],
            [
                'name' => 'Student Demo',
                'email' => 'student@school-management.test',
                'role' => 'student',
            ],
            [
                'name' => 'Parent Demo',
                'email' => 'parent@school-management.test',
                'role' => 'parent',
            ],
        ];

        foreach ($users as $userData) {
            $user = User::updateOrCreate(
                ['email' => $userData['email']],
                [
                    'establishment_id' => $establishment->id,
                    'name' => $userData['name'],
                    'password' => Hash::make('password'),
                ],
            );

            $roleId = Role::where('name', $userData['role'])->value('id');

            if ($roleId !== null) {
                $user->roles()->syncWithoutDetaching([$roleId]);
            }
        }
    }
}
