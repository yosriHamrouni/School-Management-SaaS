<?php

namespace Database\Seeders;

use App\Models\Establishment;
use App\Models\Level;
use Illuminate\Database\Seeder;

class LevelSeeder extends Seeder
{
    public function run(): void
    {
        $establishment = Establishment::firstOrFail();

        foreach (['Primary', 'Middle School', 'High School'] as $levelName) {
            Level::updateOrCreate(
                [
                    'establishment_id' => $establishment->id,
                    'name' => $levelName,
                ],
                [],
            );
        }
    }
}
