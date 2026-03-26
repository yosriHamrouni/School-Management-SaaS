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
            AdminUserSeeder::class,
            DemoUsersSeeder::class,
        ]);
    }
}
