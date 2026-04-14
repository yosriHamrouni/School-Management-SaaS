<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Schedule extends Model
{
    public const DAY_OPTIONS = [
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
        'Sunday',
    ];

    protected $fillable = [
        'establishment_id',
        'class_id',
        'subject_id',
        'teacher_id',
        'created_by',
        'day_of_week',
        'start_time',
        'end_time',
    ];

    public function establishment(): BelongsTo
    {
        return $this->belongsTo(Establishment::class);
    }

    public function schoolClass(): BelongsTo
    {
        return $this->belongsTo(SchoolClass::class, 'class_id');
    }

    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class);
    }

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function attendances(): HasMany
    {
        return $this->hasMany(Attendance::class);
    }

    public function scopeForEstablishment(Builder $query, int $establishmentId): Builder
    {
        return $query->where('establishment_id', $establishmentId);
    }

    public function scopeOrdered(Builder $query): Builder
    {
        return $query
            ->orderByRaw("
                CASE LOWER(day_of_week)
                    WHEN 'monday' THEN 1
                    WHEN 'tuesday' THEN 2
                    WHEN 'wednesday' THEN 3
                    WHEN 'thursday' THEN 4
                    WHEN 'friday' THEN 5
                    WHEN 'saturday' THEN 6
                    WHEN 'sunday' THEN 7
                    ELSE 8
                END
            ")
            ->orderBy('start_time')
            ->orderBy('end_time');
    }
}
