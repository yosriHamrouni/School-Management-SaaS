<?php

namespace App\Http\Controllers\Finance;

use App\Http\Controllers\Controller;
use App\Models\FeeType;
use App\Models\PaymentInvoice;
use App\Models\StudentProfile;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as HttpResponse;

class PaymentInvoiceController extends Controller
{
    public function index(Request $request): Response
    {
        $establishmentId = $this->establishmentId($request);
        $filters = [
            'student_id' => (string) $request->string('student_id'),
            'fee_type_id' => (string) $request->string('fee_type_id'),
            'generated_from' => (string) $request->string('generated_from'),
            'generated_to' => (string) $request->string('generated_to'),
        ];

        $paymentInvoices = PaymentInvoice::query()
            ->with([
                'student.user:id,name',
                'feeType:id,name,type',
                'payment:id,method,status,transaction_reference',
            ])
            ->where('establishment_id', $establishmentId)
            ->when($filters['student_id'] !== '', fn ($query) => $query->where('student_id', $filters['student_id']))
            ->when($filters['fee_type_id'] !== '', fn ($query) => $query->where('fee_type_id', $filters['fee_type_id']))
            ->when($filters['generated_from'] !== '', fn ($query) => $query->whereDate('generated_at', '>=', $filters['generated_from']))
            ->when($filters['generated_to'] !== '', fn ($query) => $query->whereDate('generated_at', '<=', $filters['generated_to']))
            ->latest('generated_at')
            ->latest('id')
            ->paginate(10)
            ->withQueryString()
            ->through(fn (PaymentInvoice $paymentInvoice) => $this->serializePaymentInvoice($paymentInvoice));

        return Inertia::render('Finance/Invoices/Index', [
            'filters' => $filters,
            'paymentInvoices' => $paymentInvoices,
            'options' => [
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
                'feeTypes' => FeeType::query()
                    ->where('establishment_id', $establishmentId)
                    ->orderBy('name')
                    ->get(['id', 'name', 'type']),
            ],
        ]);
    }

    public function download(Request $request, PaymentInvoice $paymentInvoice): HttpResponse
    {
        $paymentInvoice = $this->resolvePaymentInvoice($request, $paymentInvoice)
            ->load([
                'establishment',
                'student.user',
                'feeType',
                'payment',
                'sourceInvoice.academicYear',
            ]);

        $pdf = Pdf::loadView('finance.payment-invoices.show', [
            'paymentInvoice' => $paymentInvoice,
        ])->setPaper('a4');

        return $pdf->download($paymentInvoice->invoice_number.'.pdf');
    }

    private function establishmentId(Request $request): int
    {
        return (int) $request->user()->establishment_id;
    }

    private function resolvePaymentInvoice(Request $request, PaymentInvoice $paymentInvoice): PaymentInvoice
    {
        abort_unless(
            $paymentInvoice->establishment_id === $this->establishmentId($request),
            403,
        );

        return $paymentInvoice;
    }

    private function serializePaymentInvoice(PaymentInvoice $paymentInvoice): array
    {
        return [
            'id' => $paymentInvoice->id,
            'invoice_number' => $paymentInvoice->invoice_number,
            'amount_paid' => $paymentInvoice->amount_paid,
            'payment_date' => $paymentInvoice->payment_date?->toDateString(),
            'payment_method' => $paymentInvoice->payment_method,
            'payment_status' => $paymentInvoice->payment_status,
            'generated_at' => $paymentInvoice->generated_at?->toDateTimeString(),
            'pdf_url' => route('finance.payment-invoices.download', $paymentInvoice),
            'student' => [
                'id' => $paymentInvoice->student?->id,
                'name' => $paymentInvoice->student?->user?->name ?? 'Eleve inconnu',
                'student_number' => $paymentInvoice->student?->student_number,
            ],
            'fee_type' => [
                'id' => $paymentInvoice->feeType?->id,
                'name' => $paymentInvoice->feeType?->name,
                'type' => $paymentInvoice->feeType?->type,
            ],
        ];
    }
}
