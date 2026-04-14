<?php

use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        $legacyRows = collect();

        if (Schema::hasTable('notifications')) {
            $columns = Schema::getColumnListing('notifications');

            if (in_array('user_id', $columns, true) && in_array('title', $columns, true)) {
                $legacyRows = DB::table('notifications')->get()->map(fn ($row) => [
                    'id' => (string) Str::uuid(),
                    'type' => 'App\\Notifications\\LegacyDatabaseNotification',
                    'notifiable_type' => User::class,
                    'notifiable_id' => $row->user_id,
                    'data' => json_encode([
                        'title' => $row->title,
                        'body' => $row->message,
                        'category' => 'legacy',
                        'establishment_id' => $row->establishment_id,
                    ], JSON_THROW_ON_ERROR),
                    'read_at' => $row->is_read ? $row->created_at : null,
                    'created_at' => $row->created_at ?? now(),
                    'updated_at' => $row->created_at ?? now(),
                ]);
            }

            Schema::drop('notifications');
        }

        Schema::create('notifications', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('type');
            $table->morphs('notifiable');
            $table->text('data');
            $table->timestamp('read_at')->nullable();
            $table->timestamps();
        });

        if ($legacyRows->isNotEmpty()) {
            DB::table('notifications')->insert($legacyRows->all());
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
