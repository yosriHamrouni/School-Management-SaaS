<?php

namespace App\Services;

use App\Models\ClassSubject;
use App\Models\StudentProfile;
use App\Models\User;
use Illuminate\Support\Collection;

class MessagingPermissionService
{
    public function canAccessMessagingWorkspace(User $user): bool
    {
        if (! $user->establishment_id) {
            return false;
        }

        if ($user->hasRole('platform_admin') && ! $this->isEstablishmentAdministrator($user)) {
            return false;
        }

        return $this->isEstablishmentAdministrator($user)
            || $user->hasRole('teacher')
            || $user->hasRole('parent')
            || $user->hasRole('student');
    }

    public function canMessage(User $sender, User $recipient): bool
    {
        if ($sender->id === $recipient->id) {
            return false;
        }

        if (! $sender->establishment_id || ! $recipient->establishment_id) {
            return false;
        }

        if ($sender->establishment_id !== $recipient->establishment_id) {
            return false;
        }

        if (! $this->canAccessMessagingWorkspace($sender) || ! $this->canAccessMessagingWorkspace($recipient)) {
            return false;
        }

        return $this->availableRecipientIds($sender)->contains($recipient->id);
    }

    /**
     * @return Collection<int, User>
     */
    public function availableRecipients(User $user): Collection
    {
        $recipientIds = $this->availableRecipientIds($user);

        if ($recipientIds->isEmpty()) {
            return collect();
        }

        return User::query()
            ->with('roles:id,name')
            ->where('establishment_id', $user->establishment_id)
            ->whereIn('id', $recipientIds)
            ->orderBy('name')
            ->get()
            ->filter(fn (User $recipient) => $this->canAccessMessagingWorkspace($recipient))
            ->values();
    }

    /**
     * @return Collection<int, int>
     */
    public function availableRecipientIds(User $user): Collection
    {
        if (! $this->canAccessMessagingWorkspace($user)) {
            return collect();
        }

        if ($this->isEstablishmentAdministrator($user)) {
            return User::query()
                ->where('establishment_id', $user->establishment_id)
                ->where('id', '!=', $user->id)
                ->pluck('id');
        }

        if ($user->hasRole('teacher')) {
            return $this->teacherRecipientIds($user);
        }

        if ($user->hasRole('parent')) {
            return $this->parentRecipientIds($user);
        }

        if ($user->hasRole('student')) {
            return $this->studentRecipientIds($user);
        }

        return collect();
    }

    /**
     * @return Collection<int, int>
     */
    private function teacherRecipientIds(User $teacher): Collection
    {
        $classIds = ClassSubject::query()
            ->where('teacher_id', $teacher->id)
            ->pluck('class_id')
            ->unique()
            ->values();

        if ($classIds->isEmpty()) {
            return collect();
        }

        $studentProfiles = StudentProfile::query()
            ->where('establishment_id', $teacher->establishment_id)
            ->whereIn('class_id', $classIds)
            ->get(['user_id', 'id']);

        $studentIds = $studentProfiles->pluck('user_id')->filter()->unique()->values();
        $parentIds = $studentProfiles->isEmpty()
            ? collect()
            : \Illuminate\Support\Facades\DB::table('student_parent')
                ->whereIn('student_id', $studentProfiles->pluck('id'))
                ->pluck('parent_id')
                ->filter()
                ->unique()
                ->values();

        return $studentIds
            ->merge($parentIds)
            ->reject(fn (int $id) => $id === $teacher->id)
            ->unique()
            ->values();
    }

    /**
     * @return Collection<int, int>
     */
    private function parentRecipientIds(User $parent): Collection
    {
        $studentProfiles = StudentProfile::query()
            ->where('establishment_id', $parent->establishment_id)
            ->whereHas('parents', fn ($query) => $query->where('users.id', $parent->id))
            ->get(['id', 'class_id']);

        $teacherIds = $studentProfiles->isEmpty()
            ? collect()
            : ClassSubject::query()
                ->whereIn('class_id', $studentProfiles->pluck('class_id')->filter()->unique())
                ->pluck('teacher_id')
                ->filter()
                ->unique()
                ->values();

        $adminIds = User::query()
            ->where('establishment_id', $parent->establishment_id)
            ->where('id', '!=', $parent->id)
            ->whereHas('roles', fn ($query) => $query->whereIn('name', ['admin', 'establishment_admin']))
            ->pluck('id');

        return $teacherIds->merge($adminIds)->unique()->values();
    }

    /**
     * @return Collection<int, int>
     */
    private function studentRecipientIds(User $student): Collection
    {
        $studentProfile = StudentProfile::query()
            ->where('user_id', $student->id)
            ->where('establishment_id', $student->establishment_id)
            ->first();

        if (! $studentProfile?->class_id) {
            return collect();
        }

        return ClassSubject::query()
            ->where('class_id', $studentProfile->class_id)
            ->pluck('teacher_id')
            ->filter()
            ->unique()
            ->values();
    }

    private function isEstablishmentAdministrator(User $user): bool
    {
        return $user->hasRole('establishment_admin') || $user->hasRole('admin');
    }
}
