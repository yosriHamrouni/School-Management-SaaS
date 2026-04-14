<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('class_students')) {
            return;
        }

        Schema::create('class_students', function (Blueprint $table) {
            $table->id();
            $table->foreignId('class_id')->constrained('classes')->cascadeOnDelete();
            $table->foreignId('student_id')->constrained('users')->cascadeOnDelete();
            $table->timestamps();

            $table->index(['student_id', 'class_id']);
        });

        DB::statement(
            'create unique index class_students_unique_membership
            on class_students (class_id, student_id)'
        );
    }

    public function down(): void
    {
        DB::statement('drop index if exists class_students_unique_membership');

        Schema::dropIfExists('class_students');
    }
};
