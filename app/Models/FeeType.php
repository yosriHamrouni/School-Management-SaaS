<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FeeType extends Model
{
    public const TYPES = [
        'registration',
        'tuition',
        'transport',
        'canteen',
        'activity',
        'other',
    ];

    public const FREQUENCIES = [
        'once',
        'monthly',
        'quarterly',
        'yearly',
    ];

    protected $fillable = [
        'establishment_id',
        'name',
        'type',
        'description',
        'amount',
        'frequency',
        'is_active',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function establishment(): BelongsTo
    {
        return $this->belongsTo(Establishment::class);
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }

    public function paymentInvoices(): HasMany
    {
        return $this->hasMany(PaymentInvoice::class);
    }
}
