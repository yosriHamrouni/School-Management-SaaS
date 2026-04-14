<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('student_profiles') || Schema::hasColumn('student_profiles', 'class_id')) {
            return;
        }

        Schema::table('student_profiles', function (Blueprint $table) {
            $table->foreignId('class_id')
                ->nullable()
                ->after('establishment_id')
                ->constrained('classes')
                ->nullOnDelete();

            $table->index(['establishment_id', 'class_id']);
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('student_profiles') || ! Schema::hasColumn('student_profiles', 'class_id')) {
            return;
        }

        Schema::table('student_profiles', function (Blueprint $table) {
            $table->dropIndex(['establishment_id', 'class_id']);
            $table->dropConstrainedForeignId('class_id');
        });
    }
};
