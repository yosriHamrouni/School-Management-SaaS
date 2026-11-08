<?php

namespace App\Http\Requests\Teacher;

use App\Models\Assignment;
use App\Services\AssignmentService;

class UpdateAssignmentRequest extends StoreAssignmentRequest
{
    /**
     * Check ownership before validation: a teacher outside the assignment's
     * perimeter gets a 403, not validation feedback about the payload.
     * (The controller keeps its own check as defence in depth.)
     */
    public function authorize(): bool
    {
        $assignment = $this->route('assignment');

        return parent::authorize()
            && $assignment instanceof Assignment
            && app(AssignmentService::class)->canManageAssignment($this->user(), $assignment);
    }
}
