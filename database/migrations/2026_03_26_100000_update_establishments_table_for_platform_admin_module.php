<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('establishments', function (Blueprint $table) {
            $table->dropUnique('establishments_email_unique');

            $table->string('code')->nullable()->after('name');
            $table->string('type')->nullable()->after('code');
            $table->string('city')->nullable()->after('address');
            $table->string('director_name')->nullable()->after('email');
        });

        DB::table('establishments')
            ->select(['id'])
            ->orderBy('id')
            ->get()
            ->each(function (object $establishment): void {
                DB::table('establishments')
                    ->where('id', $establishment->id)
                    ->update([
                        'code' => sprintf('EST-%03d', $establishment->id),
                        'type' => 'School',
                    ]);
            });

        Schema::table('establishments', function (Blueprint $table) {
            $table->string('code')->nullable(false)->change();
            $table->string('type')->nullable(false)->change();
            $table->unique('code');
        });
    }

    public function down(): void
    {
        Schema::table('establishments', function (Blueprint $table) {
            $table->dropUnique('establishments_code_unique');
            $table->dropColumn(['code', 'type', 'city', 'director_name']);
            $table->unique('email');
        });
    }
};
