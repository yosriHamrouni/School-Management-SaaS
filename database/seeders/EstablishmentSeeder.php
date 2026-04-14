<?php

namespace Database\Seeders;

use App\Models\Establishment;
use Illuminate\Database\Seeder;

class EstablishmentSeeder extends Seeder
{
    public function run(): void
    {
        $establishments = [
            [
                'email' => 'contact@school-management.test',
                'name' => 'School Management Demo',
                'code' => 'SMD-MAIN',
                'type' => 'school',
                'address' => 'Tunis, Tunisia',
                'city' => 'Tunis',
                'phone' => '+21670000000',
                'director_name' => 'Main Demo Director',
                'is_active' => true,
            ],
            [
                'email' => 'north-campus@school-management.test',
                'name' => 'North Campus Academy',
                'code' => 'NCA-001',
                'type' => 'school',
                'address' => 'Bizerte, Tunisia',
                'city' => 'Bizerte',
                'phone' => '+21671111111',
                'director_name' => 'North Campus Director',
                'is_active' => true,
            ],
            [
                'email' => 'south-campus@school-management.test',
                'name' => 'South Campus Institute',
                'code' => 'SCI-001',
                'type' => 'school',
                'address' => 'Sfax, Tunisia',
                'city' => 'Sfax',
                'phone' => '+21672222222',
                'director_name' => 'South Campus Director',
                'is_active' => true,
            ],
        ];

        foreach ($establishments as $establishmentData) {
            Establishment::updateOrCreate(
                ['email' => $establishmentData['email']],
                $establishmentData,
            );
        }
    }
}
