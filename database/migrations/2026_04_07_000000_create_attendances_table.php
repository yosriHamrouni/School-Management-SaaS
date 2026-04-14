<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('attendances')) {
            return;
        }

        Schema::create('attendances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('establishment_id')->constrained()->cascadeOnDelete();
            $table->foreignId('schedule_id')->constrained()->cascadeOnDelete();
            $table->foreignId('student_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('teacher_id')->constrained('users')->cascadeOnDelete();
            $table->string('status', 20);
            $table->text('justification')->nullable();
            $table->timestamp('recorded_at')->nullable();
            $table->timestamps();

            $table->unique(['schedule_id', 'student_id'], 'attendances_schedule_student_unique');
            $table->index(['establishment_id', 'teacher_id', 'status']);
            $table->index(['establishment_id', 'student_id', 'status']);
            $table->index(['recorded_at']);
        });

        DB::statement("
            alter table attendances
            add constraint attendances_status_check
            check (status in ('present', 'absent', 'late'))
        ");
    }

    public function down(): void
    {
        DB::statement('alter table attendances drop constraint if exists attendances_status_check');

        Schema::dropIfExists('attendances');
    }
};
