<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class SchoolClass extends Model
{
    public $timestamps = false;

    protected $table = 'classes';

    protected $fillable = [
        'establishment_id',
        'level_id',
        'academic_year_id',
        'name',
    ];

    public function establishment(): BelongsTo
    {
        return $this->belongsTo(Establishment::class);
    }

    public function level(): BelongsTo
    {
        return $this->belongsTo(Level::class);
    }

    public function academicYear(): BelongsTo
    {
        return $this->belongsTo(AcademicYear::class);
    }

    public function schedules(): HasMany
    {
        return $this->hasMany(Schedule::class, 'class_id');
    }

    public function studentProfiles(): HasMany
    {
        return $this->hasMany(StudentProfile::class, 'class_id');
    }

    public function evaluations(): HasMany
    {
        return $this->hasMany(Evaluation::class, 'class_id');
    }

    public function classSubjects(): HasMany
    {
        return $this->hasMany(ClassSubject::class, 'class_id');
    }

    public function students(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'class_students', 'class_id', 'student_id')
            ->withTimestamps();
    }

    public function attendances(): HasManyThrough
    {
        return $this->hasManyThrough(Attendance::class, Schedule::class, 'class_id', 'schedule_id');
    }

    public function assignments(): HasMany
    {
        return $this->hasMany(Assignment::class, 'class_id');
    }

    public function assignmentSubmissions(): HasManyThrough
    {
        return $this->hasManyThrough(AssignmentSubmission::class, Assignment::class, 'class_id', 'assignment_id');
    }
}
