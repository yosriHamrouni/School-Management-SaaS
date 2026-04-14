<?php

namespace Database\Seeders;

use App\Models\AcademicYear;
use App\Models\Establishment;
use App\Models\Level;
use App\Models\SchoolClass;
use Illuminate\Database\Seeder;

class SchoolClassSeeder extends Seeder
{
    public function run(): void
    {
        $establishment = Establishment::firstOrFail();
        $academicYear = AcademicYear::query()
            ->where('establishment_id', $establishment->id)
            ->where('is_current', true)
            ->first()
            ?? AcademicYear::query()
                ->where('establishment_id', $establishment->id)
                ->orderByDesc('id')
                ->firstOrFail();

        $classesByLevel = [
            'Primary' => ['Primary A', 'Primary B'],
            'Middle School' => ['Middle 1', 'Middle 2'],
            'High School' => ['High 1', 'High 2'],
        ];

        foreach ($classesByLevel as $levelName => $classNames) {
            $level = Level::query()
                ->where('establishment_id', $establishment->id)
                ->where('name', $levelName)
                ->first();

            if (! $level) {
                continue;
            }

            foreach ($classNames as $className) {
                SchoolClass::updateOrCreate(
                    [
                        'establishment_id' => $establishment->id,
                        'level_id' => $level->id,
                        'academic_year_id' => $academicYear->id,
                        'name' => $className,
                    ],
                    [],
                );
            }
        }
    }
}
