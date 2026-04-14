<?php

namespace Database\Seeders;

use App\Models\AcademicYear;
use App\Models\Establishment;
use Illuminate\Database\Seeder;

class AcademicYearSeeder extends Seeder
{
    public function run(): void
    {
        $establishment = Establishment::firstOrFail();

        $academicYears = [
            [
                'name' => '2024/2025',
                'start_date' => '2024-09-01',
                'end_date' => '2025-06-30',
                'status' => 'inactive',
                'is_current' => false,
            ],
            [
                'name' => '2025/2026',
                'start_date' => '2025-09-01',
                'end_date' => '2026-06-30',
                'status' => 'active',
                'is_current' => true,
            ],
        ];

        foreach ($academicYears as $academicYearData) {
            AcademicYear::updateOrCreate(
                [
                    'establishment_id' => $establishment->id,
                    'name' => $academicYearData['name'],
                ],
                $academicYearData,
            );
        }

        AcademicYear::query()
            ->where('establishment_id', $establishment->id)
            ->where('name', '!=', '2025/2026')
            ->update(['is_current' => false]);
    }
}
