<?php

namespace App\Http\Requests\Finance;

use App\Models\Payment;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePaymentRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $invoice = $this->route('invoice');

        if ($invoice) {
            $this->merge(['invoice_id' => $invoice->id]);
        }
    }

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'invoice_id' => ['required', 'exists:invoices,id'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'payment_date' => ['required', 'date'],
            'method' => ['required', Rule::in(Payment::METHODS)],
            'status' => ['required', Rule::in(Payment::STATUSES)],
            'transaction_reference' => ['nullable', 'string', 'max:255'],
        ];
    }
}
