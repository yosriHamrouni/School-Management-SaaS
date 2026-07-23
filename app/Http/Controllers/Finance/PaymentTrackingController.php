<?php

namespace App\Http\Controllers\Finance;

use App\Http\Controllers\Controller;
use App\Http\Requests\Finance\StorePaymentRequest;
use App\Models\AcademicYear;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\StudentProfile;
use App\Services\Finance\PaymentTrackingService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PaymentTrackingController extends Controller
{
    public function __construct(
        private readonly PaymentTrackingService $paymentTrackingService,
    ) {}

    public function index(Request $request): Response
    {
        $establishmentId = $this->establishmentId($request);
        $filters = [
            'status' => (string) $request->string('status'),
            'student_id' => (string) $request->string('student_id'),
            'academic_year_id' => (string) $request->string('academic_year_id'),
            'due_from' => (string) $request->string('due_from'),
            'due_to' => (string) $request->string('due_to'),
        ];

        $invoices = Invoice::query()
            ->with([
                'student.user:id,name',
                'feeType:id,name,type',
                'academicYear:id,name',
                'payments' => fn ($query) => $query->latest('payment_date')->latest('id'),
            ])
            ->where('establishment_id', $establishmentId)
            ->when($filters['status'] !== '', fn ($query) => $query->where('status', $filters['status']))
            ->when($filters['student_id'] !== '', fn ($query) => $query->where('student_id', $filters['student_id']))
            ->when($filters['academic_year_id'] !== '', fn ($query) => $query->where('academic_year_id', $filters['academic_year_id']))
            ->when($filters['due_from'] !== '', fn ($query) => $query->whereDate('due_date', '>=', $filters['due_from']))
            ->when($filters['due_to'] !== '', fn ($query) => $query->whereDate('due_date', '<=', $filters['due_to']))
            ->orderBy('due_date')
            ->paginate(10)
            ->withQueryString()
            ->through(fn (Invoice $invoice) => $this->serializeInvoice($invoice));

        return Inertia::render('Finance/Payments/Index', [
            'filters' => $filters,
            'invoices' => $invoices,
            'options' => $this->options($establishmentId),
        ]);
    }

    public function show(Request $request, Invoice $invoice): Response
    {
        $invoice = $this->resolveInvoice($request, $invoice)
            ->load([
                'student.user:id,name,email',
                'feeType:id,name,type',
                'academicYear:id,name',
                'payments' => fn ($query) => $query->latest('payment_date')->latest('id'),
            ]);

        return Inertia::render('Finance/Payments/Show', [
            'invoice' => $this->serializeInvoice($invoice),
            'options' => [
                'paymentMethods' => Payment::METHODS,
                'paymentStatuses' => Payment::STATUSES,
            ],
        ]);
    }

    public function storePayment(
        StorePaymentRequest $request,
        Invoice $invoice,
    ): RedirectResponse {
        $invoice = $this->resolveInvoice($request, $invoice);
        $validated = $request->validated();

        abort_unless((int) $validated['invoice_id'] === (int) $invoice->id, 403);

        $this->paymentTrackingService->recordPayment($invoice, $validated);

        return redirect()
            ->back()
            ->with('success', 'Paiement enregistre avec succes.');
    }

    public function cancelPayment(Request $request, Payment $payment): RedirectResponse
    {
        $payment = $this->resolvePayment($request, $payment);
        $this->paymentTrackingService->cancelPayment($payment);

        return redirect()
            ->back()
            ->with('success', 'Paiement annule avec succes.');
    }

    private function establishmentId(Request $request): int
    {
        return (int) $request->user()->establishment_id;
    }

    private function resolveInvoice(Request $request, Invoice $invoice): Invoice
    {
        abort_unless(
            $invoice->establishment_id === $this->establishmentId($request),
            403,
        );

        return $this->paymentTrackingService->refreshInvoiceStatus($invoice);
    }

    private function resolvePayment(Request $request, Payment $payment): Payment
    {
        abort_unless(
            $payment->establishment_id === $this->establishmentId($request),
            403,
        );

        return $payment;
    }

    private function serializeInvoice(Invoice $invoice): array
    {
        $invoice = $this->paymentTrackingService->refreshInvoiceStatus($invoice);

        return [
            'id' => $invoice->id,
            'invoice_number' => $invoice->invoice_number,
            'description' => $invoice->description,
            'amount' => $invoice->amount,
            'due_date' => $invoice->due_date?->toDateString(),
            'status' => $invoice->status,
            'total_paid' => number_format($this->paymentTrackingService->getTotalPaid($invoice), 2, '.', ''),
            'remaining_amount' => number_format($this->paymentTrackingService->getRemainingAmount($invoice), 2, '.', ''),
            'student' => [
                'id' => $invoice->student?->id,
                'name' => $invoice->student?->user?->name ?? 'Eleve inconnu',
                'student_number' => $invoice->student?->student_number,
            ],
            'fee_type' => [
                'id' => $invoice->feeType?->id,
                'name' => $invoice->feeType?->name,
                'type' => $invoice->feeType?->type,
            ],
            'academic_year' => [
                'id' => $invoice->academicYear?->id,
                'name' => $invoice->academicYear?->name,
            ],
            'payments' => $invoice->payments
                ->map(fn (Payment $payment) => [
                    'id' => $payment->id,
                    'amount' => $payment->amount,
                    'payment_date' => $payment->payment_date?->toDateString(),
                    'method' => $payment->method,
                    'status' => $payment->status,
                    'transaction_reference' => $payment->transaction_reference,
                    'created_at' => $payment->created_at?->toDateTimeString(),
                ])
                ->values(),
        ];
    }

    private function options(int $establishmentId): array
    {
        return [
            'invoiceStatuses' => Invoice::STATUSES,
            'paymentMethods' => Payment::METHODS,
            'paymentStatuses' => Payment::STATUSES,
            'students' => StudentProfile::query()
                ->with('user:id,name')
                ->where('establishment_id', $establishmentId)
                ->orderBy('student_number')
                ->get()
                ->map(fn (StudentProfile $student) => [
                    'id' => $student->id,
                    'name' => $student->user?->name ?? 'Eleve inconnu',
                    'student_number' => $student->student_number,
                ]),
            'academicYears' => AcademicYear::query()
                ->where('establishment_id', $establishmentId)
                ->orderByDesc('start_date')
                ->get(['id', 'name']),
        ];
    }
}
