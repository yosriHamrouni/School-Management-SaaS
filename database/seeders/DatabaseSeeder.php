<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            EstablishmentSeeder::class,
            RoleSeeder::class,
            PermissionSeeder::class,
            AcademicYearSeeder::class,
            LevelSeeder::class,
            SubjectSeeder::class,
            SchoolClassSeeder::class,
            AdminUserSeeder::class,
            DemoUsersSeeder::class,
            ScheduleSeeder::class,
            MyScheduleDemoSeeder::class,
            AssignmentDemoSeeder::class,
            FinanceSeeder::class,
            GradeDemoSeeder::class,
            RiskDemoSeeder::class,
        ]);
    }
}
