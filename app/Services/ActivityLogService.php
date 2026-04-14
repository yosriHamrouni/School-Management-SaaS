<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class ActivityLogService
{
    public function log(
        User $actor,
        string $action,
        string $description,
        ?Model $subject = null,
        array $properties = [],
    ): void {
        if (! Schema::hasTable('activity_logs')) {
            return;
        }

        $columns = array_flip(Schema::getColumnListing('activity_logs'));
        $payload = [];

        if (isset($columns['user_id'])) {
            $payload['user_id'] = $actor->id;
        }

        if (isset($columns['establishment_id'])) {
            $payload['establishment_id'] = $actor->establishment_id;
        }

        if (isset($columns['action'])) {
            $payload['action'] = $action;
        }

        if (isset($columns['description'])) {
            $payload['description'] = $description;
        }

        if (isset($columns['subject_type'])) {
            $payload['subject_type'] = $subject ? $subject::class : null;
        }

        if (isset($columns['subject_id'])) {
            $payload['subject_id'] = $subject?->getKey();
        }

        if (isset($columns['properties'])) {
            $payload['properties'] = json_encode($properties, JSON_THROW_ON_ERROR);
        }

        if (isset($columns['created_at'])) {
            $payload['created_at'] = now();
        }

        if (isset($columns['updated_at'])) {
            $payload['updated_at'] = now();
        }

        if ($payload !== []) {
            DB::table('activity_logs')->insert($payload);
        }
    }
}
