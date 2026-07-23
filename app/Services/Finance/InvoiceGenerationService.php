<?php

namespace App\Services\Finance;

use App\Models\Payment;
use App\Models\PaymentInvoice;
use Carbon\CarbonInterface;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;

class InvoiceGenerationService
{
    public function generateForPayment(Payment $payment): PaymentInvoice
    {
        for ($attempt = 0; $attempt < 5; $attempt++) {
            try {
                return DB::transaction(function () use ($payment) {
                    $payment = Payment::query()
                        ->with('invoice')
                        ->whereKey($payment->id)
                        ->lockForUpdate()
                        ->firstOrFail();

                    $existingInvoice = PaymentInvoice::query()
                        ->where('payment_id', $payment->id)
                        ->first();

                    if ($existingInvoice !== null) {
                        return $existingInvoice;
                    }

                    $sourceInvoice = $payment->invoice;
                    $generatedAt = now();

                    return PaymentInvoice::create([
                        'establishment_id' => $payment->establishment_id,
                        'payment_id' => $payment->id,
                        'source_invoice_id' => $sourceInvoice->id,
                        'student_id' => $sourceInvoice->student_id,
                        'fee_type_id' => $sourceInvoice->fee_type_id,
                        'invoice_number' => $this->nextInvoiceNumber(
                            (int) $payment->establishment_id,
                            $generatedAt,
                        ),
                        'amount_paid' => $payment->amount,
                        'payment_date' => $payment->payment_date,
                        'payment_method' => $payment->method,
                        'payment_status' => $payment->status,
                        'generated_at' => $generatedAt,
                    ]);
                });
            } catch (QueryException $exception) {
                if (! $this->isUniqueConstraintViolation($exception) || $attempt === 4) {
                    throw $exception;
                }
            }
        }

        return PaymentInvoice::query()
            ->where('payment_id', $payment->id)
            ->firstOrFail();
    }

    private function nextInvoiceNumber(int $establishmentId, CarbonInterface $generatedAt): string
    {
        $year = (int) $generatedAt->format('Y');
        $prefix = "INV-{$year}-{$establishmentId}-";

        $latestNumber = PaymentInvoice::query()
            ->where('establishment_id', $establishmentId)
            ->whereYear('generated_at', $year)
            ->where('invoice_number', 'like', $prefix.'%')
            ->lockForUpdate()
            ->orderByDesc('id')
            ->value('invoice_number');

        $sequence = 1;

        if (is_string($latestNumber) && preg_match('/-(\d+)$/', $latestNumber, $matches) === 1) {
            $sequence = ((int) $matches[1]) + 1;
        }

        return $prefix.str_pad((string) $sequence, 4, '0', STR_PAD_LEFT);
    }

    private function isUniqueConstraintViolation(QueryException $exception): bool
    {
        return $exception->getCode() === '23505'
            || str_contains(strtolower($exception->getMessage()), 'unique');
    }
}
