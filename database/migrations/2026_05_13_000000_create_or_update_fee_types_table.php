<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('fee_types')) {
            Schema::create('fee_types', function (Blueprint $table) {
                $table->id();
                $table->foreignId('establishment_id')->constrained()->cascadeOnDelete();
                $table->string('name');
                $table->string('type');
                $table->text('description')->nullable();
                $table->decimal('amount', 10, 2);
                $table->string('frequency');
                $table->boolean('is_active')->default(true);
                $table->timestamps();

                $table->index(['establishment_id', 'is_active']);
                $table->index(['establishment_id', 'type']);
            });

            return;
        }

        Schema::table('fee_types', function (Blueprint $table) {
            if (! Schema::hasColumn('fee_types', 'type')) {
                $table->string('type')->default('other')->after('name');
            }

            if (! Schema::hasColumn('fee_types', 'description')) {
                $table->text('description')->nullable()->after('type');
            }

            if (! Schema::hasColumn('fee_types', 'amount')) {
                $table->decimal('amount', 10, 2)->default(0)->after('description');
            }

            if (! Schema::hasColumn('fee_types', 'frequency')) {
                $table->string('frequency')->default('once')->after('amount');
            }

            if (! Schema::hasColumn('fee_types', 'is_active')) {
                $table->boolean('is_active')->default(true)->after('frequency');
            }

            if (! Schema::hasColumn('fee_types', 'updated_at')) {
                $table->timestamp('updated_at')->nullable()->after('created_at');
            }
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fee_types');
    }
};
