<?php

use App\Models\AcademicYear;
use App\Models\Establishment;
use App\Models\FeeType;
use App\Models\Invoice;
use App\Models\PaymentInvoice;
use App\Models\Role;
use App\Models\StudentProfile;
use App\Models\User;
use App\Services\Finance\InvoiceGenerationService;

test('a payment invoice is created automatically after recording a payment', function () {
    [$establishment, $admin, $invoice] = createFinanceInvoiceFixture('Auto Invoice School', 'AUTO-INV');

    $this
        ->actingAs($admin)
        ->withSession(['_token' => 'test-token'])
        ->post(route('finance.invoices.payments.store', $invoice), [
            '_token' => 'test-token',
            'invoice_id' => $invoice->id,
            'amount' => '350.00',
            'payment_date' => '2026-06-15',
            'method' => 'cash',
            'status' => 'completed',
            'transaction_reference' => 'PAY-AUTO-001',
        ])
        ->assertRedirect();

    $paymentInvoice = PaymentInvoice::first();

    expect($paymentInvoice)->not->toBeNull()
        ->and($paymentInvoice->establishment_id)->toBe($establishment->id)
        ->and($paymentInvoice->payment_id)->not->toBeNull()
        ->and($paymentInvoice->student_id)->toBe($invoice->student_id)
        ->and($paymentInvoice->fee_type_id)->toBe($invoice->fee_type_id)
        ->and((float) $paymentInvoice->amount_paid)->toBe(350.0);
});

test('generated payment invoice numbers are readable and unique', function () {
    [$establishment, $admin, $firstInvoice] = createFinanceInvoiceFixture('Number School', 'NUM-INV');
    [, , $secondInvoice] = createFinanceInvoiceFixture('Number School', 'NUM-INV-2', $establishment);

    $this->actingAs($admin)->withSession(['_token' => 'test-token'])->post(route('finance.invoices.payments.store', $firstInvoice), [
        '_token' => 'test-token',
        'invoice_id' => $firstInvoice->id,
        'amount' => '100.00',
        'payment_date' => '2026-06-15',
        'method' => 'cash',
        'status' => 'completed',
    ]);

    $this->actingAs($admin)->withSession(['_token' => 'test-token'])->post(route('finance.invoices.payments.store', $secondInvoice), [
        '_token' => 'test-token',
        'invoice_id' => $secondInvoice->id,
        'amount' => '120.00',
        'payment_date' => '2026-06-15',
        'method' => 'card',
        'status' => 'completed',
    ]);

    expect(PaymentInvoice::orderBy('id')->pluck('invoice_number')->all())->toBe([
        "INV-2026-{$establishment->id}-0001",
        "INV-2026-{$establishment->id}-0002",
    ]);
});

test('a payment cannot receive duplicate generated invoices', function () {
    [, $admin, $invoice] = createFinanceInvoiceFixture('No Duplicate School', 'NO-DUP');

    $this->actingAs($admin)->withSession(['_token' => 'test-token'])->post(route('finance.invoices.payments.store', $invoice), [
        '_token' => 'test-token',
        'invoice_id' => $invoice->id,
        'amount' => '90.00',
        'payment_date' => '2026-06-15',
        'method' => 'cash',
        'status' => 'completed',
    ]);

    $payment = $invoice->payments()->firstOrFail();

    app(InvoiceGenerationService::class)->generateForPayment($payment);
    app(InvoiceGenerationService::class)->generateForPayment($payment);

    expect(PaymentInvoice::where('payment_id', $payment->id)->count())->toBe(1);
});

test('an administrator cannot list another establishment payment invoices', function () {
    [$firstEstablishment, $firstAdmin, $firstInvoice] = createFinanceInvoiceFixture('Tenant One', 'TEN-ONE');
    [$secondEstablishment, $secondAdmin, $secondInvoice] = createFinanceInvoiceFixture('Tenant Two', 'TEN-TWO');

    $this->actingAs($firstAdmin)->withSession(['_token' => 'test-token'])->post(route('finance.invoices.payments.store', $firstInvoice), [
        '_token' => 'test-token',
        'invoice_id' => $firstInvoice->id,
        'amount' => '150.00',
        'payment_date' => '2026-06-15',
        'method' => 'cash',
        'status' => 'completed',
    ]);

    $this->actingAs($secondAdmin)->withSession(['_token' => 'test-token'])->post(route('finance.invoices.payments.store', $secondInvoice), [
        '_token' => 'test-token',
        'invoice_id' => $secondInvoice->id,
        'amount' => '175.00',
        'payment_date' => '2026-06-15',
        'method' => 'cash',
        'status' => 'completed',
    ]);

    $response = $this
        ->actingAs($firstAdmin)
        ->get(route('finance.payment-invoices.index'))
        ->assertOk();

    $response->assertInertia(fn ($page) => $page
        ->component('Finance/Invoices/Index')
        ->where('paymentInvoices.data.0.invoice_number', "INV-2026-{$firstEstablishment->id}-0001")
        ->missing('paymentInvoices.data.1')
    );

    expect(PaymentInvoice::where('establishment_id', $secondEstablishment->id)->count())->toBe(1);
});

test('payment invoice pdf is tenant scoped and restricted to authorized roles', function () {
    [, $admin, $invoice] = createFinanceInvoiceFixture('Pdf School', 'PDF-SCHOOL');
    [, $otherAdmin] = createFinanceInvoiceFixture('Other Pdf School', 'OTHER-PDF');

    $teacher = User::factory()->create([
        'establishment_id' => $admin->establishment_id,
    ]);
    $teacher->roles()->syncWithoutDetaching([
        Role::firstOrCreate(['name' => 'teacher'])->id,
    ]);

    $this->actingAs($admin)->withSession(['_token' => 'test-token'])->post(route('finance.invoices.payments.store', $invoice), [
        '_token' => 'test-token',
        'invoice_id' => $invoice->id,
        'amount' => '250.00',
        'payment_date' => '2026-06-15',
        'method' => 'bank_transfer',
        'status' => 'completed',
    ]);

    $paymentInvoice = PaymentInvoice::firstOrFail();

    $this
        ->actingAs($teacher)
        ->get(route('finance.payment-invoices.download', $paymentInvoice))
        ->assertForbidden();

    $this
        ->actingAs($otherAdmin)
        ->get(route('finance.payment-invoices.download', $paymentInvoice))
        ->assertForbidden();

    $this
        ->actingAs($admin)
        ->get(route('finance.payment-invoices.download', $paymentInvoice))
        ->assertOk()
        ->assertHeader('content-type', 'application/pdf');
});

function createFinanceInvoiceFixture(
    string $establishmentName,
    string $code,
    ?Establishment $establishment = null,
): array {
    $establishment ??= Establishment::create([
        'name' => $establishmentName,
        'code' => $code,
        'type' => 'School',
        'address' => '1 Finance Street',
        'city' => 'Tunis',
        'phone' => '12345678',
        'email' => strtolower($code).'@school.test',
    ]);

    $admin = User::factory()->create([
        'establishment_id' => $establishment->id,
    ]);
    $admin->roles()->syncWithoutDetaching([
        Role::firstOrCreate(['name' => 'establishment_admin'])->id,
    ]);

    $studentUser = User::factory()->create([
        'establishment_id' => $establishment->id,
    ]);
    $studentUser->roles()->syncWithoutDetaching([
        Role::firstOrCreate(['name' => 'student'])->id,
    ]);

    $student = StudentProfile::create([
        'user_id' => $studentUser->id,
        'establishment_id' => $establishment->id,
        'student_number' => fake()->unique()->bothify($code.'-###'),
    ]);

    $feeType = FeeType::create([
        'establishment_id' => $establishment->id,
        'name' => 'Tuition',
        'type' => 'tuition',
        'amount' => 500,
        'frequency' => 'monthly',
        'is_active' => true,
    ]);

    $academicYear = AcademicYear::firstOrCreate(
        [
            'establishment_id' => $establishment->id,
            'is_current' => true,
        ],
        [
            'name' => $code.' 2025-2026',
            'start_date' => '2025-09-01',
            'end_date' => '2026-06-30',
            'status' => 'active',
        ],
    );

    $invoice = Invoice::create([
        'establishment_id' => $establishment->id,
        'student_id' => $student->id,
        'fee_type_id' => $feeType->id,
        'invoice_number' => $code.'-BASE-'.fake()->unique()->numerify('###'),
        'description' => 'Monthly tuition',
        'amount' => 500,
        'due_date' => '2026-06-30',
        'status' => 'pending',
        'academic_year_id' => $academicYear->id,
    ]);

    return [$establishment, $admin, $invoice];
}
