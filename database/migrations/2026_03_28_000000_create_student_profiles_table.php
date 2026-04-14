<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('student_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('establishment_id')->constrained()->cascadeOnDelete();
            $table->string('student_number');
            $table->date('date_of_birth')->nullable();
            $table->string('gender', 50)->nullable();
            $table->date('enrollment_date')->nullable();
            $table->string('status', 100)->nullable();
            $table->string('photo_url')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('establishment_id');
            $table->index('status');
        });

        DB::statement(
            'create unique index student_profiles_user_id_active_unique
            on student_profiles (user_id)
            where deleted_at is null'
        );

        DB::statement(
            'create unique index student_profiles_student_number_active_unique
            on student_profiles (student_number)
            where deleted_at is null'
        );
    }

    public function down(): void
    {
        DB::statement('drop index if exists student_profiles_student_number_active_unique');
        DB::statement('drop index if exists student_profiles_user_id_active_unique');

        Schema::dropIfExists('student_profiles');
    }
};
