<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('student_parent', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('student_profiles')->cascadeOnDelete();
            $table->foreignId('parent_id')->constrained('users')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['student_id', 'parent_id']);
            $table->index('parent_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_parent');
    }
};
