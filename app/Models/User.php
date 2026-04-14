<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable, TwoFactorAuthenticatable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'establishment_id',
        'name',
        'email',
        'password',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
        ];
    }

    public function establishment(): BelongsTo
    {
        return $this->belongsTo(Establishment::class);
    }

    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class);
    }

    public function studentProfile(): HasOne
    {
        return $this->hasOne(StudentProfile::class);
    }

    public function children(): BelongsToMany
    {
        return $this->belongsToMany(StudentProfile::class, 'student_parent', 'parent_id', 'student_id');
    }

    public function teachingSchedules(): HasMany
    {
        return $this->hasMany(Schedule::class, 'teacher_id');
    }

    public function createdSchedules(): HasMany
    {
        return $this->hasMany(Schedule::class, 'created_by');
    }

    public function classSubjectAssignments(): HasMany
    {
        return $this->hasMany(ClassSubject::class, 'teacher_id');
    }

    public function createdEvaluations(): HasMany
    {
        return $this->hasMany(Evaluation::class, 'created_by');
    }

    public function updatedEvaluations(): HasMany
    {
        return $this->hasMany(Evaluation::class, 'updated_by');
    }

    public function studentGrades(): HasMany
    {
        return $this->hasMany(Grade::class, 'student_id');
    }

    public function studentAttendances(): HasMany
    {
        return $this->hasMany(Attendance::class, 'student_id');
    }

    public function recordedAttendances(): HasMany
    {
        return $this->hasMany(Attendance::class, 'teacher_id');
    }

    public function sentMessages(): HasMany
    {
        return $this->hasMany(Message::class, 'sender_id');
    }

    public function receivedMessages(): HasMany
    {
        return $this->hasMany(Message::class, 'receiver_id');
    }

    public function assignmentSubmissions(): HasMany
    {
        return $this->hasMany(AssignmentSubmission::class, 'student_id');
    }

    public function hasRole(string $role): bool
    {
        $this->loadMissing('roles');

        return $this->roles->contains(fn (Role $userRole) => $userRole->name === $role);
    }
}
