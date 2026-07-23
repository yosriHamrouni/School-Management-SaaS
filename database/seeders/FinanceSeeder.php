<?php

namespace Database\Seeders;

use App\Models\AcademicYear;
use App\Models\Establishment;
use App\Models\FeeType;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\StudentProfile;
use App\Services\Finance\InvoiceGenerationService;
use App\Services\Finance\PaymentTrackingService;
use Illuminate\Database\Seeder;

class FinanceSeeder extends Seeder
{
    public function run(): void
    {
        $invoiceGenerationService = app(InvoiceGenerationService::class);
        $paymentTrackingService = app(PaymentTrackingService::class);

        Establishment::query()
            ->orderBy('id')
            ->get()
            ->each(function (Establishment $establishment) use ($invoiceGenerationService, $paymentTrackingService) {
                $feeTypes = $this->seedFeeTypes($establishment);
                $academicYear = AcademicYear::query()
                    ->where('establishment_id', $establishment->id)
                    ->where('is_current', true)
                    ->first()
                    ?? AcademicYear::query()
                        ->where('establishment_id', $establishment->id)
                        ->orderByDesc('start_date')
                        ->first();

                if ($academicYear === null) {
                    return;
                }

                StudentProfile::query()
                    ->with('user:id,name')
                    ->where('establishment_id', $establishment->id)
                    ->orderBy('student_number')
                    ->take(6)
                    ->get()
                    ->values()
                    ->each(function (StudentProfile $student, int $index) use ($establishment, $feeTypes, $academicYear, $invoiceGenerationService, $paymentTrackingService) {
                        $tuitionInvoice = $this->seedInvoice(
                            establishment: $establishment,
                            student: $student,
                            feeType: $feeTypes['tuition'],
                            academicYear: $academicYear,
                            invoiceNumber: sprintf('FIN-%s-TUI-%03d', $academicYear->name, $index + 1),
                            description: 'Frais de scolarite du premier trimestre',
                            dueDate: '2026-01-15',
                        );

                        $this->seedPayment(
                            invoice: $tuitionInvoice,
                            amount: match ($index) {
                                0, 1 => (float) $feeTypes['tuition']->amount,
                                2, 3 => 250.00,
                                default => 0.00,
                            },
                            paymentDate: match ($index) {
                                0 => '2025-12-20',
                                1 => '2026-01-03',
                                2 => '2026-01-10',
                                3 => '2026-01-18',
                                default => null,
                            },
                            method: match ($index) {
                                0, 4 => 'cash',
                                1 => 'bank_transfer',
                                2 => 'card',
                                3 => 'cheque',
                                default => 'cash',
                            },
                            reference: sprintf('DEMO-PAY-TUI-%03d', $index + 1),
                            invoiceGenerationService: $invoiceGenerationService,
                        );

                        $registrationInvoice = $this->seedInvoice(
                            establishment: $establishment,
                            student: $student,
                            feeType: $feeTypes['registration'],
                            academicYear: $academicYear,
                            invoiceNumber: sprintf('FIN-%s-REG-%03d', $academicYear->name, $index + 1),
                            description: 'Frais d inscription annuelle',
                            dueDate: '2025-09-20',
                        );

                        $this->seedPayment(
                            invoice: $registrationInvoice,
                            amount: (float) $feeTypes['registration']->amount,
                            paymentDate: '2025-09-10',
                            method: 'cash',
                            reference: sprintf('DEMO-PAY-REG-%03d', $index + 1),
                            invoiceGenerationService: $invoiceGenerationService,
                        );

                        if ($index < 3) {
                            $transportInvoice = $this->seedInvoice(
                                establishment: $establishment,
                                student: $student,
                                feeType: $feeTypes['transport'],
                                academicYear: $academicYear,
                                invoiceNumber: sprintf('FIN-%s-TRN-%03d', $academicYear->name, $index + 1),
                                description: 'Abonnement transport scolaire',
                                dueDate: '2026-02-05',
                            );

                            $this->seedPayment(
                                invoice: $transportInvoice,
                                amount: $index === 0 ? (float) $feeTypes['transport']->amount : 0.00,
                                paymentDate: $index === 0 ? '2026-01-25' : null,
                                method: 'bank_transfer',
                                reference: sprintf('DEMO-PAY-TRN-%03d', $index + 1),
                                invoiceGenerationService: $invoiceGenerationService,
                            );

                            $paymentTrackingService->refreshInvoiceStatus($transportInvoice);
                        }

                        $paymentTrackingService->refreshInvoiceStatus($tuitionInvoice);
                        $paymentTrackingService->refreshInvoiceStatus($registrationInvoice);
                    });
            });
    }

    /**
     * @return array<string, FeeType>
     */
    private function seedFeeTypes(Establishment $establishment): array
    {
        $definitions = [
            'registration' => [
                'name' => 'Frais d inscription',
                'type' => 'registration',
                'description' => 'Frais annuels payes au moment de l inscription.',
                'amount' => 150.00,
                'frequency' => 'yearly',
            ],
            'tuition' => [
                'name' => 'Frais de scolarite',
                'type' => 'tuition',
                'description' => 'Frais de scolarite trimestriels.',
                'amount' => 500.00,
                'frequency' => 'quarterly',
            ],
            'transport' => [
                'name' => 'Transport scolaire',
                'type' => 'transport',
                'description' => 'Abonnement au transport scolaire.',
                'amount' => 120.00,
                'frequency' => 'monthly',
            ],
            'canteen' => [
                'name' => 'Cantine',
                'type' => 'canteen',
                'description' => 'Frais de cantine mensuels.',
                'amount' => 90.00,
                'frequency' => 'monthly',
            ],
        ];

        $feeTypes = [];

        foreach ($definitions as $key => $definition) {
            $feeTypes[$key] = FeeType::updateOrCreate(
                [
                    'establishment_id' => $establishment->id,
                    'type' => $definition['type'],
                    'name' => $definition['name'],
                ],
                [
                    'description' => $definition['description'],
                    'amount' => $definition['amount'],
                    'frequency' => $definition['frequency'],
                    'is_active' => true,
                ],
            );
        }

        return $feeTypes;
    }

    private function seedInvoice(
        Establishment $establishment,
        StudentProfile $student,
        FeeType $feeType,
        AcademicYear $academicYear,
        string $invoiceNumber,
        string $description,
        string $dueDate,
    ): Invoice {
        return Invoice::updateOrCreate(
            [
                'establishment_id' => $establishment->id,
                'invoice_number' => $invoiceNumber,
            ],
            [
                'student_id' => $student->id,
                'fee_type_id' => $feeType->id,
                'description' => $description,
                'amount' => $feeType->amount,
                'due_date' => $dueDate,
                'status' => 'pending',
                'academic_year_id' => $academicYear->id,
            ],
        );
    }

    private function seedPayment(
        Invoice $invoice,
        float $amount,
        ?string $paymentDate,
        string $method,
        string $reference,
        InvoiceGenerationService $invoiceGenerationService,
    ): void {
        if ($amount <= 0.0 || $paymentDate === null) {
            return;
        }

        $payment = Payment::updateOrCreate(
            [
                'invoice_id' => $invoice->id,
                'transaction_reference' => $reference,
            ],
            [
                'establishment_id' => $invoice->establishment_id,
                'amount' => $amount,
                'payment_date' => $paymentDate,
                'method' => $method,
                'status' => 'completed',
            ],
        );

        $invoiceGenerationService->generateForPayment($payment);
    }
}
