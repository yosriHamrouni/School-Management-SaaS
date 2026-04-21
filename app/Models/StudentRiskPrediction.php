<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentRiskPrediction extends Model
{
    protected $fillable = [
        'student_id',
        'establishment_id',
        'school_year_id',
        'risk_level',
        'risk_score',
        'reasons',
        'features',
        'source',
        'analyzed_at',
    ];

    protected $casts = [
        'risk_score' => 'integer',
        'reasons' => 'array',
        'features' => 'array',
        'analyzed_at' => 'datetime',
    ];

    public function student(): BelongsTo
    {
        return $this->belongsTo(StudentProfile::class, 'student_id');
    }

    public function establishment(): BelongsTo
    {
        return $this->belongsTo(Establishment::class);
    }

    public function schoolYear(): BelongsTo
    {
        return $this->belongsTo(AcademicYear::class, 'school_year_id');
    }
}
