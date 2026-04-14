<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('evaluations')) {
            return;
        }

        Schema::create('evaluations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('establishment_id')->constrained()->cascadeOnDelete();
            $table->foreignId('class_id')->constrained('classes')->cascadeOnDelete();
            $table->foreignId('subject_id')->constrained()->cascadeOnDelete();
            $table->foreignId('term_id')->nullable()->constrained()->nullOnDelete();
            $table->string('title');
            $table->date('evaluation_date');
            $table->string('type');
            $table->decimal('coefficient', 8, 2)->default(1);
            $table->decimal('max_grade', 8, 2);
            $table->text('description')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['establishment_id', 'class_id']);
            $table->index(['establishment_id', 'subject_id']);
            $table->index(['term_id', 'evaluation_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('evaluations');
    }
};
