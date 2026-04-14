<?php

namespace App\Services;

use App\Models\Assignment;
use App\Models\AssignmentSubmission;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class AssignmentSubmissionService
{
    public function storeForStudent(
        User $student,
        Assignment $assignment,
        UploadedFile $attachment,
        ?string $submissionText = null,
    ): AssignmentSubmission {
        return DB::transaction(function () use ($student, $assignment, $attachment, $submissionText) {
            $existingSubmission = AssignmentSubmission::query()
                ->where('assignment_id', $assignment->id)
                ->where('student_id', $student->id)
                ->first();

            $path = $attachment->store(
                "assignments/{$assignment->establishment_id}/students/{$student->id}",
                'public',
            );

            if ($existingSubmission?->attachment_path) {
                Storage::disk('public')->delete($existingSubmission->attachment_path);
            }

            return AssignmentSubmission::query()->updateOrCreate(
                [
                    'assignment_id' => $assignment->id,
                    'student_id' => $student->id,
                ],
                [
                    'establishment_id' => $assignment->establishment_id,
                    'submission_text' => $submissionText,
                    'attachment_path' => $path,
                    'attachment_original_name' => $attachment->getClientOriginalName(),
                    'attachment_mime' => $attachment->getClientMimeType(),
                    'attachment_size' => $attachment->getSize(),
                    'submitted_at' => now(),
                ],
            );
        });
    }
}
