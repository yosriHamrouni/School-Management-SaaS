<?php

namespace Database\Seeders;

use App\Models\Establishment;
use App\Models\Role;
use App\Models\SchoolClass;
use App\Models\StudentProfile;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;

class DemoUsersSeeder extends Seeder
{
    public function run(): void
    {
        $primaryEstablishment = Establishment::query()
            ->where('email', 'contact@school-management.test')
            ->firstOrFail();

        $users = [
            [
                'name' => 'Platform Admin Demo',
                'email' => 'platform-admin@school-management.test',
                'role' => 'platform_admin',
                'establishment_email' => 'contact@school-management.test',
            ],
            [
                'name' => 'Main Establishment Admin',
                'email' => 'establishment-admin@school-management.test',
                'role' => 'establishment_admin',
                'establishment_email' => 'contact@school-management.test',
            ],
            [
                'name' => 'North Campus Admin',
                'email' => 'north-admin@school-management.test',
                'role' => 'establishment_admin',
                'establishment_email' => 'north-campus@school-management.test',
            ],
            [
                'name' => 'South Campus Admin',
                'email' => 'south-admin@school-management.test',
                'role' => 'establishment_admin',
                'establishment_email' => 'south-campus@school-management.test',
            ],
            [
                'name' => 'Teacher Demo',
                'email' => 'teacher@school-management.test',
                'role' => 'teacher',
                'establishment_email' => 'contact@school-management.test',
            ],
            [
                'name' => 'Student Demo',
                'email' => 'student@school-management.test',
                'role' => 'student',
                'establishment_email' => 'contact@school-management.test',
            ],
            [
                'name' => 'Student Demo 2',
                'email' => 'student2@school-management.test',
                'role' => 'student',
                'establishment_email' => 'contact@school-management.test',
            ],
            [
                'name' => 'Student Demo 3',
                'email' => 'student3@school-management.test',
                'role' => 'student',
                'establishment_email' => 'contact@school-management.test',
            ],
            [
                'name' => 'Student Demo 4',
                'email' => 'student4@school-management.test',
                'role' => 'student',
                'establishment_email' => 'contact@school-management.test',
            ],
            [
                'name' => 'Student Demo 5',
                'email' => 'student5@school-management.test',
                'role' => 'student',
                'establishment_email' => 'contact@school-management.test',
            ],
            [
                'name' => 'Student Demo 6',
                'email' => 'student6@school-management.test',
                'role' => 'student',
                'establishment_email' => 'contact@school-management.test',
            ],
            [
                'name' => 'Parent Demo',
                'email' => 'parent@school-management.test',
                'role' => 'parent',
                'establishment_email' => 'contact@school-management.test',
            ],
        ];

        foreach ($users as $userData) {
            $establishment = Establishment::query()
                ->where('email', $userData['establishment_email'])
                ->firstOrFail();

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

            if ($userData['role'] === 'student') {
                $className = match ($userData['email']) {
                    'student3@school-management.test', 'student4@school-management.test' => 'Primary B',
                    'student5@school-management.test', 'student6@school-management.test' => 'Middle 1',
                    default => 'Primary A',
                };

                $schoolClass = SchoolClass::query()
                    ->where('establishment_id', $primaryEstablishment->id)
                    ->where('name', $className)
                    ->first()
                    ?? SchoolClass::query()
                        ->where('establishment_id', $primaryEstablishment->id)
                        ->orderBy('name')
                        ->first();

                $studentSeedData = match ($userData['email']) {
                    'student2@school-management.test' => [
                        'student_number' => 'STU-DEMO-002',
                        'date_of_birth' => '2010-08-21',
                        'gender' => 'female',
                    ],
                    'student3@school-management.test' => [
                        'student_number' => 'STU-DEMO-003',
                        'date_of_birth' => '2011-01-11',
                        'gender' => 'male',
                    ],
                    'student4@school-management.test' => [
                        'student_number' => 'STU-DEMO-004',
                        'date_of_birth' => '2010-03-08',
                        'gender' => 'female',
                    ],
                    'student5@school-management.test' => [
                        'student_number' => 'STU-DEMO-005',
                        'date_of_birth' => '2009-11-19',
                        'gender' => 'male',
                    ],
                    'student6@school-management.test' => [
                        'student_number' => 'STU-DEMO-006',
                        'date_of_birth' => '2009-06-04',
                        'gender' => 'female',
                    ],
                    default => [
                        'student_number' => 'STU-DEMO-001',
                        'date_of_birth' => '2010-05-15',
                        'gender' => 'male',
                    ],
                };

                StudentProfile::updateOrCreate(
                    ['user_id' => $user->id],
                    [
                        'establishment_id' => $primaryEstablishment->id,
                        'class_id' => $schoolClass?->id,
                        'student_number' => $studentSeedData['student_number'],
                        'date_of_birth' => $studentSeedData['date_of_birth'],
                        'gender' => $studentSeedData['gender'],
                        'enrollment_date' => '2025-09-01',
                        'status' => 'active',
                        'photo_url' => null,
                    ],
                );

                if (Schema::hasTable('class_students') && $schoolClass) {
                    DB::table('class_students')->updateOrInsert(
                        [
                            'class_id' => $schoolClass->id,
                            'student_id' => $user->id,
                        ],
                        [
                            'created_at' => now(),
                            'updated_at' => now(),
                        ],
                    );
                }
            }
        }
    }
}
