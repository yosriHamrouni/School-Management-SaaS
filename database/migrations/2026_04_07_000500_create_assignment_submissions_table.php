<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('assignment_submissions')) {
            return;
        }

        Schema::create('assignment_submissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('establishment_id')->constrained()->cascadeOnDelete();
            $table->foreignId('assignment_id')->constrained()->cascadeOnDelete();
            $table->foreignId('student_id')->constrained('users')->cascadeOnDelete();
            $table->text('submission_text')->nullable();
            $table->string('attachment_path');
            $table->string('attachment_original_name');
            $table->string('attachment_mime', 150)->nullable();
            $table->unsignedBigInteger('attachment_size')->nullable();
            $table->timestamp('submitted_at');
            $table->timestamps();

            $table->unique(['assignment_id', 'student_id']);
            $table->index(['establishment_id', 'student_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('assignment_submissions');
    }
};
