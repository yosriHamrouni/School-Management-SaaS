<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Level extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'establishment_id',
        'name',
    ];

    public function establishment(): BelongsTo
    {
        return $this->belongsTo(Establishment::class);
    }

    public function classes(): HasMany
    {
        return $this->hasMany(SchoolClass::class, 'level_id');
    }
}
