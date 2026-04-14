<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('class_subjects')) {
            return;
        }

        Schema::create('class_subjects', function (Blueprint $table) {
            $table->id();
            $table->foreignId('class_id')->constrained('classes')->cascadeOnDelete();
            $table->foreignId('subject_id')->constrained()->cascadeOnDelete();
            $table->foreignId('teacher_id')->constrained('users')->cascadeOnDelete();

            $table->index(['class_id', 'teacher_id']);
            $table->index(['subject_id', 'teacher_id']);
        });

        DB::statement(
            'create unique index class_subjects_assignment_unique
            on class_subjects (class_id, subject_id, teacher_id)'
        );
    }

    public function down(): void
    {
        DB::statement('drop index if exists class_subjects_assignment_unique');

        Schema::dropIfExists('class_subjects');
    }
};
