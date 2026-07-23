<?php

namespace App\Services\Finance;

use App\Models\Invoice;
use App\Models\Payment;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PaymentTrackingService
{
    public function __construct(
        private readonly InvoiceGenerationService $invoiceGenerationService,
    ) {}

    public function getTotalPaid(Invoice $invoice): float
    {
        return round((float) $invoice->payments()
            ->where('status', 'completed')
            ->sum('amount'), 2);
    }

    public function getRemainingAmount(Invoice $invoice): float
    {
        return max(round((float) $invoice->amount - $this->getTotalPaid($invoice), 2), 0.0);
    }

    public function refreshInvoiceStatus(Invoice $invoice): Invoice
    {
        $totalPaid = $this->getTotalPaid($invoice);
        $amount = (float) $invoice->amount;

        $status = match (true) {
            $totalPaid >= $amount => 'paid',
            $invoice->due_date->lt(today()) => 'overdue',
            $totalPaid > 0.0 => 'partial',
            default => 'pending',
        };

        $invoice->forceFill(['status' => $status])->save();

        return $invoice->refresh();
    }

    public function recordPayment(Invoice $invoice, array $data): Payment
    {
        return DB::transaction(function () use ($invoice, $data) {
            $invoice = Invoice::query()
                ->whereKey($invoice->id)
                ->lockForUpdate()
                ->firstOrFail();

            $this->refreshInvoiceStatus($invoice);

            if (($data['status'] ?? null) === 'completed') {
                $remainingAmount = $this->getRemainingAmount($invoice);

                if ($remainingAmount <= 0.0) {
                    throw ValidationException::withMessages([
                        'amount' => 'Cette facture est deja payee.',
                    ]);
                }

                if (round((float) $data['amount'], 2) > $remainingAmount) {
                    throw ValidationException::withMessages([
                        'amount' => 'Le paiement ne peut pas depasser le montant restant du.',
                    ]);
                }
            }

            $payment = Payment::create([
                'establishment_id' => $invoice->establishment_id,
                'invoice_id' => $invoice->id,
                'amount' => $data['amount'],
                'payment_date' => $data['payment_date'],
                'method' => $data['method'],
                'status' => $data['status'],
                'transaction_reference' => $data['transaction_reference'] ?? null,
            ]);

            $this->refreshInvoiceStatus($invoice);
            $this->invoiceGenerationService->generateForPayment($payment);

            return $payment;
        });
    }

    public function cancelPayment(Payment $payment): Payment
    {
        return DB::transaction(function () use ($payment) {
            $payment = Payment::query()
                ->with('generatedInvoice')
                ->whereKey($payment->id)
                ->lockForUpdate()
                ->firstOrFail();

            $payment->update(['status' => 'cancelled']);
            $payment->generatedInvoice?->update(['payment_status' => 'cancelled']);
            $this->refreshInvoiceStatus($payment->invoice);

            return $payment->refresh();
        });
    }
}
