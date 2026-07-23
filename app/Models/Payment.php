<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Payment extends Model
{
    public const STATUSES = [
        'completed',
        'pending',
        'failed',
        'cancelled',
    ];

    public const METHODS = [
        'cash',
        'bank_transfer',
        'card',
        'cheque',
        'other',
    ];

    public const UPDATED_AT = null;

    protected $fillable = [
        'establishment_id',
        'invoice_id',
        'amount',
        'payment_date',
        'method',
        'status',
        'transaction_reference',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'payment_date' => 'date',
    ];

    public function establishment(): BelongsTo
    {
        return $this->belongsTo(Establishment::class);
    }

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }

    public function generatedInvoice(): HasOne
    {
        return $this->hasOne(PaymentInvoice::class);
    }
}
