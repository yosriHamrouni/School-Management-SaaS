<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('invoices')) {
            Schema::create('invoices', function (Blueprint $table) {
                $table->id();
                $table->foreignId('establishment_id')->constrained()->cascadeOnDelete();
                $table->foreignId('student_id')->constrained('student_profiles')->cascadeOnDelete();
                $table->foreignId('fee_type_id')->constrained()->restrictOnDelete();
                $table->string('invoice_number');
                $table->text('description')->nullable();
                $table->decimal('amount', 10, 2);
                $table->date('due_date');
                $table->string('status')->default('pending');
                $table->foreignId('academic_year_id')->nullable()->constrained()->nullOnDelete();
                $table->timestamps();

                $table->unique(['establishment_id', 'invoice_number']);
                $table->index(['establishment_id', 'status']);
                $table->index(['establishment_id', 'student_id']);
                $table->index(['establishment_id', 'due_date']);
            });

            return;
        }

        Schema::table('invoices', function (Blueprint $table) {
            if (! Schema::hasColumn('invoices', 'establishment_id')) {
                $table->foreignId('establishment_id')->after('id')->constrained()->cascadeOnDelete();
            }

            if (! Schema::hasColumn('invoices', 'student_id')) {
                $table->foreignId('student_id')->after('establishment_id')->constrained('student_profiles')->cascadeOnDelete();
            }

            if (! Schema::hasColumn('invoices', 'fee_type_id')) {
                $table->foreignId('fee_type_id')->after('student_id')->constrained()->restrictOnDelete();
            }

            if (! Schema::hasColumn('invoices', 'invoice_number')) {
                $table->string('invoice_number')->after('fee_type_id');
            }

            if (! Schema::hasColumn('invoices', 'description')) {
                $table->text('description')->nullable()->after('invoice_number');
            }

            if (! Schema::hasColumn('invoices', 'amount')) {
                $table->decimal('amount', 10, 2)->default(0)->after('description');
            }

            if (! Schema::hasColumn('invoices', 'due_date')) {
                $table->date('due_date')->nullable()->after('amount');
            }

            if (! Schema::hasColumn('invoices', 'status')) {
                $table->string('status')->default('pending')->after('due_date');
            }

            if (! Schema::hasColumn('invoices', 'academic_year_id')) {
                $table->foreignId('academic_year_id')->nullable()->after('status')->constrained()->nullOnDelete();
            }

            if (! Schema::hasColumn('invoices', 'created_at')) {
                $table->timestamp('created_at')->nullable();
            }

            if (! Schema::hasColumn('invoices', 'updated_at')) {
                $table->timestamp('updated_at')->nullable();
            }
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invoices');
    }
};
