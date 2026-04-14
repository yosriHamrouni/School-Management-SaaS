<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('schedules')) {
            return;
        }

        Schema::create('schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('establishment_id')->constrained()->cascadeOnDelete();
            $table->foreignId('class_id')->constrained('classes')->cascadeOnDelete();
            $table->foreignId('subject_id')->constrained()->cascadeOnDelete();
            $table->foreignId('teacher_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('day_of_week', 20);
            $table->time('start_time');
            $table->time('end_time');
            $table->timestamps();

            $table->index(['establishment_id', 'day_of_week', 'start_time']);
            $table->index(['establishment_id', 'class_id', 'day_of_week', 'start_time', 'end_time'], 'schedules_class_conflict_idx');
            $table->index(['establishment_id', 'teacher_id', 'day_of_week', 'start_time', 'end_time'], 'schedules_teacher_conflict_idx');
            $table->index(['establishment_id', 'subject_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('schedules');
    }
};
