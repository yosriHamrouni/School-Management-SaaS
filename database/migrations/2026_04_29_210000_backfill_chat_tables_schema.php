<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('chat_conversations')) {
            Schema::table('chat_conversations', function (Blueprint $table) {
                if (! Schema::hasColumn('chat_conversations', 'user_id')) {
                    $table->foreignId('user_id')->nullable()->after('id')->constrained()->cascadeOnDelete();
                }

                if (! Schema::hasColumn('chat_conversations', 'establishment_id')) {
                    $table->foreignId('establishment_id')->nullable()->after('user_id')->constrained()->nullOnDelete();
                }

                if (! Schema::hasColumn('chat_conversations', 'title')) {
                    $table->string('title')->nullable()->after('establishment_id');
                }
            });
        }

        if (Schema::hasTable('chat_messages')) {
            Schema::table('chat_messages', function (Blueprint $table) {
                if (! Schema::hasColumn('chat_messages', 'conversation_id')) {
                    $table->foreignId('conversation_id')->nullable()->after('id')->constrained('chat_conversations')->cascadeOnDelete();
                }

                if (! Schema::hasColumn('chat_messages', 'role')) {
                    $table->string('role', 20)->nullable()->after('conversation_id');
                }

                if (! Schema::hasColumn('chat_messages', 'content')) {
                    $table->text('content')->nullable()->after('role');
                }

                if (! Schema::hasColumn('chat_messages', 'metadata')) {
                    $table->json('metadata')->nullable()->after('content');
                }
            });
        }
    }

    public function down(): void
    {
        // Intentionally left empty to avoid dropping data during rollback.
    }
};
