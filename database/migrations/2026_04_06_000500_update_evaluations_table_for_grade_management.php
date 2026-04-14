<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('evaluations')) {
            return;
        }

        Schema::table('evaluations', function (Blueprint $table) {
            if (! Schema::hasColumn('evaluations', 'type')) {
                $table->string('type')->default('exam');
            }

            if (! Schema::hasColumn('evaluations', 'coefficient')) {
                $table->decimal('coefficient', 8, 2)->default(1);
            }

            if (! Schema::hasColumn('evaluations', 'max_grade')) {
                $table->decimal('max_grade', 8, 2)->nullable();
            }

            if (! Schema::hasColumn('evaluations', 'description')) {
                $table->text('description')->nullable();
            }

            if (! Schema::hasColumn('evaluations', 'created_by')) {
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            }

            if (! Schema::hasColumn('evaluations', 'updated_by')) {
                $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            }

            if (! Schema::hasColumn('evaluations', 'created_at')) {
                $table->timestamp('created_at')->nullable();
            }

            if (! Schema::hasColumn('evaluations', 'updated_at')) {
                $table->timestamp('updated_at')->nullable();
            }

            if (! Schema::hasColumn('evaluations', 'deleted_at')) {
                $table->softDeletes();
            }
        });

        if (Schema::hasColumn('evaluations', 'max_grade')) {
            DB::table('evaluations')
                ->whereNull('max_grade')
                ->update(['max_grade' => 20]);
        }
    }

    public function down(): void
    {
        //
    }
};
