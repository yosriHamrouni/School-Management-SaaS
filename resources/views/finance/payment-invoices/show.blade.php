<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    <title>Facture {{ $paymentInvoice->invoice_number }}</title>
    <style>
        body {
            color: #111827;
            font-family: DejaVu Sans, sans-serif;
            font-size: 12px;
            line-height: 1.5;
            margin: 0;
        }

        .page {
            padding: 36px;
        }

        .header {
            border-bottom: 2px solid #111827;
            display: table;
            margin-bottom: 28px;
            padding-bottom: 18px;
            width: 100%;
        }

        .header-section {
            display: table-cell;
            vertical-align: top;
            width: 50%;
        }

        h1 {
            font-size: 24px;
            margin: 0 0 8px;
        }

        h2 {
            font-size: 15px;
            margin: 0 0 10px;
        }

        .muted {
            color: #6b7280;
        }

        .invoice-number {
            font-size: 18px;
            font-weight: 700;
            text-align: right;
        }

        .grid {
            display: table;
            margin-bottom: 24px;
            width: 100%;
        }

        .panel {
            border: 1px solid #d1d5db;
            display: table-cell;
            padding: 14px;
            vertical-align: top;
            width: 50%;
        }

        .panel + .panel {
            border-left: 0;
        }

        table {
            border-collapse: collapse;
            margin-top: 10px;
            width: 100%;
        }

        th {
            background: #f3f4f6;
            color: #374151;
            font-weight: 700;
            text-align: left;
        }

        th,
        td {
            border: 1px solid #d1d5db;
            padding: 10px;
        }

        .total {
            font-size: 18px;
            font-weight: 700;
            text-align: right;
        }

        .footer {
            border-top: 1px solid #d1d5db;
            color: #6b7280;
            margin-top: 36px;
            padding-top: 12px;
            text-align: center;
        }
    </style>
</head>
<body>
<div class="page">
    <div class="header">
        <div class="header-section">
            <h1>{{ $paymentInvoice->establishment->name }}</h1>
            <div class="muted">{{ $paymentInvoice->establishment->address }}</div>
            <div class="muted">
                {{ $paymentInvoice->establishment->city }}
                @if($paymentInvoice->establishment->phone)
                    - {{ $paymentInvoice->establishment->phone }}
                @endif
            </div>
            <div class="muted">{{ $paymentInvoice->establishment->email }}</div>
        </div>
        <div class="header-section">
            <div class="invoice-number">{{ $paymentInvoice->invoice_number }}</div>
            <div class="muted" style="text-align: right;">
                Generee le {{ $paymentInvoice->generated_at?->format('d/m/Y H:i') }}
            </div>
        </div>
    </div>

    <div class="grid">
        <div class="panel">
            <h2>Eleve</h2>
            <div><strong>{{ $paymentInvoice->student->user?->name ?? 'Eleve inconnu' }}</strong></div>
            <div class="muted">Matricule: {{ $paymentInvoice->student->student_number ?? '-' }}</div>
        </div>
        <div class="panel">
            <h2>Reference paiement</h2>
            <div>Date: {{ $paymentInvoice->payment_date?->format('d/m/Y') }}</div>
            <div>Methode: {{ $paymentInvoice->payment_method ?? '-' }}</div>
            <div>Statut: {{ $paymentInvoice->payment_status ?? '-' }}</div>
            <div>Transaction: {{ $paymentInvoice->payment->transaction_reference ?? '-' }}</div>
        </div>
    </div>

    <table>
        <thead>
        <tr>
            <th>Type de frais</th>
            <th>Facture source</th>
            <th>Annee scolaire</th>
            <th style="text-align: right;">Montant paye</th>
        </tr>
        </thead>
        <tbody>
        <tr>
            <td>{{ $paymentInvoice->feeType->name }}</td>
            <td>{{ $paymentInvoice->sourceInvoice->invoice_number }}</td>
            <td>{{ $paymentInvoice->sourceInvoice->academicYear?->name ?? '-' }}</td>
            <td style="text-align: right;">{{ number_format((float) $paymentInvoice->amount_paid, 2, ',', ' ') }}</td>
        </tr>
        </tbody>
    </table>

    <p class="total">
        Total paye: {{ number_format((float) $paymentInvoice->amount_paid, 2, ',', ' ') }}
    </p>

    <div class="footer">
        Cette facture a ete generee automatiquement apres l'enregistrement du paiement.
    </div>
</div>
</body>
</html>
