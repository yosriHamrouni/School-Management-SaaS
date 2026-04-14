<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('academic_years', function (Blueprint $table) {
            $table->id();
            $table->foreignId('establishment_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->date('start_date');
            $table->date('end_date');
            $table->string('status');
            $table->boolean('is_current')->default(false);
            $table->timestamps();

            $table->index(['establishment_id', 'name']);
        });

        DB::statement(
            'create unique index academic_years_current_unique_per_establishment
            on academic_years (establishment_id)
            where is_current = true'
        );
    }

    public function down(): void
    {
        DB::statement(
            'drop index if exists academic_years_current_unique_per_establishment'
        );

        Schema::dropIfExists('academic_years');
    }
};
