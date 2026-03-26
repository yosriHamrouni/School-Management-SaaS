<?php

namespace Database\Seeders;

use App\Models\Establishment;
use Illuminate\Database\Seeder;

class EstablishmentSeeder extends Seeder
{
    public function run(): void
    {
        Establishment::updateOrCreate(
            ['email' => 'contact@school-management.test'],
            [
                'name' => 'School Management Demo',
                'address' => 'Tunis, Tunisia',
                'phone' => '+21670000000',
                'is_active' => true,
            ],
        );
    }
}
