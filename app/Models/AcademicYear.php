<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class AcademicYear extends Model
{
    protected $fillable = [
        'establishment_id',
        'name',
        'start_date',
        'end_date',
        'status',
        'is_current',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'is_current' => 'boolean',
    ];

    public function establishment(): BelongsTo
    {
        return $this->belongsTo(Establishment::class);
    }

    public function classes(): HasMany
    {
        return $this->hasMany(SchoolClass::class, 'academic_year_id');
    }

    public function terms(): HasMany
    {
        return $this->hasMany(Term::class);
    }

    public function assignments(): HasMany
    {
        return $this->hasMany(Assignment::class);
    }

    public function assignmentSubmissions(): HasManyThrough
    {
        return $this->hasManyThrough(AssignmentSubmission::class, Assignment::class);
    }
}
