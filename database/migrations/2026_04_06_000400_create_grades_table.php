<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('grades')) {
            return;
        }

        Schema::create('grades', function (Blueprint $table) {
            $table->id();
            $table->foreignId('evaluation_id')->constrained('evaluations')->cascadeOnDelete();
            $table->foreignId('student_id')->constrained('users')->cascadeOnDelete();
            $table->decimal('grade', 8, 2);
            $table->text('remarks')->nullable();
            $table->timestamps();

            $table->index(['student_id', 'evaluation_id']);
        });

        DB::statement(
            'create unique index grades_evaluation_student_unique
            on grades (evaluation_id, student_id)'
        );
    }

    public function down(): void
    {
        DB::statement('drop index if exists grades_evaluation_student_unique');

        Schema::dropIfExists('grades');
    }
};
