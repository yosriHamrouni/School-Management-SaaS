<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Evaluation extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'establishment_id',
        'class_id',
        'subject_id',
        'term_id',
        'title',
        'evaluation_date',
        'type',
        'coefficient',
        'max_grade',
        'description',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'evaluation_date' => 'date',
        'coefficient' => 'decimal:2',
        'max_grade' => 'decimal:2',
        'deleted_at' => 'datetime',
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

    public function term(): BelongsTo
    {
        return $this->belongsTo(Term::class);
    }

    public function grades(): HasMany
    {
        return $this->hasMany(Grade::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
}
