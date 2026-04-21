<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('student_risk_predictions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('student_profiles')->cascadeOnDelete();
            $table->foreignId('establishment_id')->constrained()->cascadeOnDelete();
            $table->foreignId('school_year_id')->constrained('academic_years')->cascadeOnDelete();
            $table->string('risk_level', 50);
            $table->unsignedSmallInteger('risk_score');
            $table->json('reasons');
            $table->json('features');
            $table->string('source', 50);
            $table->timestamp('analyzed_at');
            $table->timestamps();

            $table->index('student_id');
            $table->index('establishment_id');
            $table->index('school_year_id');
            $table->index(['establishment_id', 'school_year_id']);
            $table->index(['student_id', 'school_year_id']);
            $table->index('analyzed_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_risk_predictions');
    }
};
