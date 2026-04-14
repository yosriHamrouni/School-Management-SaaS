<?php

namespace Database\Seeders;

use App\Models\Establishment;
use App\Models\Subject;
use Illuminate\Database\Seeder;

class SubjectSeeder extends Seeder
{
    public function run(): void
    {
        $establishment = Establishment::firstOrFail();

        foreach ([
            'Mathematics',
            'Physics',
            'English',
            'History',
            'Computer Science',
        ] as $subjectName) {
            Subject::updateOrCreate(
                [
                    'establishment_id' => $establishment->id,
                    'name' => $subjectName,
                ],
                [],
            );
        }
    }
}
