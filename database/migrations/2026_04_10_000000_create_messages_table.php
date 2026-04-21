<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('establishment_id')->constrained()->cascadeOnDelete();
            $table->foreignId('sender_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('receiver_id')->constrained('users')->cascadeOnDelete();
            $table->string('conversation_key', 64);
            $table->text('content');
            $table->timestamp('read_at')->nullable();
            $table->timestamps();

            $table->index(['establishment_id', 'conversation_key', 'created_at']);
            $table->index(['receiver_id', 'read_at']);
            $table->index(['sender_id', 'created_at']);
        });

        if (DB::getDriverName() !== 'sqlite') {
            DB::statement('alter table messages add constraint messages_sender_receiver_check check (sender_id <> receiver_id)');
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('messages');
    }
};
