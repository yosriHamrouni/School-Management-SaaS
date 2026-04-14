<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('classes')) {
            return;
        }

        Schema::create('classes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('establishment_id')->constrained()->cascadeOnDelete();
            $table->foreignId('level_id')->constrained('levels')->cascadeOnDelete();
            $table->foreignId('academic_year_id')->constrained()->cascadeOnDelete();
            $table->string('name');

            $table->index(['establishment_id', 'name']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('classes');
    }
};
