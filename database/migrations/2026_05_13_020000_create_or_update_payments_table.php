<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('payments')) {
            Schema::create('payments', function (Blueprint $table) {
                $table->id();
                $table->foreignId('establishment_id')->constrained()->cascadeOnDelete();
                $table->foreignId('invoice_id')->constrained()->cascadeOnDelete();
                $table->decimal('amount', 10, 2);
                $table->date('payment_date');
                $table->string('method');
                $table->string('status')->default('completed');
                $table->string('transaction_reference')->nullable();
                $table->timestamp('created_at')->nullable();

                $table->index(['establishment_id', 'status']);
                $table->index(['establishment_id', 'payment_date']);
                $table->index(['invoice_id', 'status']);
            });

            return;
        }

        Schema::table('payments', function (Blueprint $table) {
            if (! Schema::hasColumn('payments', 'establishment_id')) {
                $table->foreignId('establishment_id')->after('id')->constrained()->cascadeOnDelete();
            }

            if (! Schema::hasColumn('payments', 'invoice_id')) {
                $table->foreignId('invoice_id')->after('establishment_id')->constrained()->cascadeOnDelete();
            }

            if (! Schema::hasColumn('payments', 'amount')) {
                $table->decimal('amount', 10, 2)->default(0)->after('invoice_id');
            }

            if (! Schema::hasColumn('payments', 'payment_date')) {
                $table->date('payment_date')->nullable()->after('amount');
            }

            if (! Schema::hasColumn('payments', 'method')) {
                $table->string('method')->default('cash')->after('payment_date');
            }

            if (! Schema::hasColumn('payments', 'status')) {
                $table->string('status')->default('completed')->after('method');
            }

            if (! Schema::hasColumn('payments', 'transaction_reference')) {
                $table->string('transaction_reference')->nullable()->after('status');
            }

            if (! Schema::hasColumn('payments', 'created_at')) {
                $table->timestamp('created_at')->nullable();
            }
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
