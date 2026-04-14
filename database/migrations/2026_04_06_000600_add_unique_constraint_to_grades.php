<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('grades')) {
            return;
        }

        DB::statement(
            'create unique index if not exists grades_evaluation_student_unique
            on grades (evaluation_id, student_id)'
        );
    }

    public function down(): void
    {
        DB::statement('drop index if exists grades_evaluation_student_unique');
    }
};
