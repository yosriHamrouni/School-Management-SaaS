import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import type { FormEvent } from 'react';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type InvoiceStatus = 'pending' | 'partial' | 'paid' | 'overdue';
type PaymentStatus = 'completed' | 'pending' | 'failed' | 'cancelled';
type PaymentMethod = 'cash' | 'bank_transfer' | 'card' | 'cheque' | 'other';

type Payment = {
    id: number;
    amount: string;
    payment_date: string;
    method: PaymentMethod;
    status: PaymentStatus;
    transaction_reference: string | null;
};

type Invoice = {
    id: number;
    invoice_number: string;
    description: string | null;
    amount: string;
    due_date: string;
    status: InvoiceStatus;
    total_paid: string;
    remaining_amount: string;
    student: {
        id: number;
        name: string;
        student_number: string | null;
    };
    fee_type: {
        id: number;
        name: string;
        type: string;
    };
    academic_year: {
        id: number | null;
        name: string | null;
    };
    payments: Payment[];
};

type PageProps = {
    invoice: Invoice;
    options: {
        paymentMethods: PaymentMethod[];
        paymentStatuses: PaymentStatus[];
    };
    flash?: {
        success?: string | null;
        error?: string | null;
    };
};

type PaymentFormData = {
    amount: string;
    payment_date: string;
    method: PaymentMethod;
    status: PaymentStatus;
    transaction_reference: string;
};

const invoiceStatusLabels: Record<InvoiceStatus, string> = {
    pending: 'En attente',
    partial: 'Partiellement payee',
    paid: 'Payee',
    overdue: 'En retard',
};

const paymentStatusLabels: Record<PaymentStatus, string> = {
    completed: 'Valide',
    pending: 'En attente',
    failed: 'Echoue',
    cancelled: 'Annule',
};

const paymentMethodLabels: Record<PaymentMethod, string> = {
    cash: 'Especes',
    bank_transfer: 'Virement bancaire',
    card: 'Carte bancaire',
    cheque: 'Cheque',
    other: 'Autre',
};

function formatAmount(amount: string) {
    return new Intl.NumberFormat('fr-FR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(Number(amount));
}

function today() {
    return new Date().toISOString().slice(0, 10);
}

function statusVariant(status: InvoiceStatus) {
    if (status === 'paid') {
        return 'default';
    }

    if (status === 'overdue') {
        return 'destructive';
    }

    return 'secondary';
}

export default function PaymentShow({ invoice, options }: PageProps) {
    const { flash } = usePage<PageProps>().props;
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Payments', href: '/finance/payments' },
        {
            title: invoice.invoice_number,
            href: `/finance/invoices/${invoice.id}`,
        },
    ];

    const form = useForm<PaymentFormData>({
        amount: invoice.remaining_amount,
        payment_date: today(),
        method: 'cash',
        status: 'completed',
        transaction_reference: '',
    });

    const submitPayment = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        form.post(`/finance/invoices/${invoice.id}/payments`, {
            preserveScroll: true,
            onSuccess: () => form.reset(),
        });
    };

    const cancelPayment = (payment: Payment) => {
        if (!window.confirm('Annuler ce paiement ?')) {
            return;
        }

        router.patch(`/finance/payments/${payment.id}/cancel`, {}, {
            preserveScroll: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Invoice ${invoice.invoice_number}`} />

            <div className="grid gap-6 p-4">
                <div className="flex flex-col gap-4 rounded-xl border border-sidebar-border/70 bg-background p-6 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">
                            Facture {invoice.invoice_number}
                        </h1>
                        <p className="mt-2 text-sm text-muted-foreground">
                            {invoice.student.name} - {invoice.fee_type.name}
                        </p>
                    </div>
                    <Button variant="outline" asChild>
                        <Link href="/finance/payments">Retour</Link>
                    </Button>
                </div>

                {flash?.success ? (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                        {flash.success}
                    </div>
                ) : null}

                {flash?.error ? (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {flash.error}
                    </div>
                ) : null}

                <div className="grid gap-4 md:grid-cols-4">
                    {[
                        ['Montant total', formatAmount(invoice.amount)],
                        ['Montant paye', formatAmount(invoice.total_paid)],
                        ['Reste a payer', formatAmount(invoice.remaining_amount)],
                        ['Echeance', invoice.due_date],
                    ].map(([label, value]) => (
                        <div
                            key={label}
                            className="rounded-xl border border-sidebar-border/70 bg-background p-4"
                        >
                            <div className="text-sm text-muted-foreground">
                                {label}
                            </div>
                            <div className="mt-2 text-xl font-semibold">
                                {value}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="rounded-xl border border-sidebar-border/70 bg-background p-6">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-lg font-semibold">Etat facture</h2>
                        <Badge variant={statusVariant(invoice.status)}>
                            {invoiceStatusLabels[invoice.status]}
                        </Badge>
                    </div>
                    <dl className="grid gap-3 text-sm md:grid-cols-2">
                        <div>
                            <dt className="text-muted-foreground">Eleve</dt>
                            <dd>{invoice.student.name}</dd>
                        </div>
                        <div>
                            <dt className="text-muted-foreground">
                                Annee scolaire
                            </dt>
                            <dd>{invoice.academic_year.name ?? '-'}</dd>
                        </div>
                        <div>
                            <dt className="text-muted-foreground">
                                Type de frais
                            </dt>
                            <dd>{invoice.fee_type.name}</dd>
                        </div>
                        <div>
                            <dt className="text-muted-foreground">
                                Description
                            </dt>
                            <dd>{invoice.description ?? '-'}</dd>
                        </div>
                    </dl>
                </div>

                <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
                    <div className="overflow-hidden rounded-xl border border-sidebar-border/70 bg-background">
                        <div className="border-b px-4 py-3 text-lg font-semibold">
                            Paiements
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-border">
                                <thead className="bg-muted/50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                                            Date
                                        </th>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                                            Montant
                                        </th>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                                            Methode
                                        </th>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                                            Statut
                                        </th>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                                            Reference
                                        </th>
                                        <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {invoice.payments.length > 0 ? (
                                        invoice.payments.map((payment) => (
                                            <tr key={payment.id}>
                                                <td className="px-4 py-3 text-sm">
                                                    {payment.payment_date}
                                                </td>
                                                <td className="px-4 py-3 text-sm">
                                                    {formatAmount(payment.amount)}
                                                </td>
                                                <td className="px-4 py-3 text-sm">
                                                    {
                                                        paymentMethodLabels[
                                                            payment.method
                                                        ]
                                                    }
                                                </td>
                                                <td className="px-4 py-3 text-sm">
                                                    {
                                                        paymentStatusLabels[
                                                            payment.status
                                                        ]
                                                    }
                                                </td>
                                                <td className="px-4 py-3 text-sm">
                                                    {payment.transaction_reference ??
                                                        '-'}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        disabled={
                                                            payment.status ===
                                                            'cancelled'
                                                        }
                                                        onClick={() =>
                                                            cancelPayment(payment)
                                                        }
                                                    >
                                                        Annuler
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td
                                                colSpan={6}
                                                className="px-4 py-8 text-center text-sm text-muted-foreground"
                                            >
                                                Aucun paiement enregistre.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <form
                        onSubmit={submitPayment}
                        className="grid content-start gap-4 rounded-xl border border-sidebar-border/70 bg-background p-5"
                    >
                        <h2 className="text-lg font-semibold">
                            Enregistrer paiement
                        </h2>

                        <div className="grid gap-2">
                            <Label htmlFor="amount">Montant</Label>
                            <Input
                                id="amount"
                                type="number"
                                min="0.01"
                                step="0.01"
                                value={form.data.amount}
                                onChange={(event) =>
                                    form.setData('amount', event.target.value)
                                }
                            />
                            <InputError message={form.errors.amount} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="payment_date">Date</Label>
                            <Input
                                id="payment_date"
                                type="date"
                                value={form.data.payment_date}
                                onChange={(event) =>
                                    form.setData(
                                        'payment_date',
                                        event.target.value,
                                    )
                                }
                            />
                            <InputError message={form.errors.payment_date} />
                        </div>

                        <div className="grid gap-2">
                            <Label>Methode</Label>
                            <Select
                                value={form.data.method}
                                onValueChange={(value) =>
                                    form.setData('method', value as PaymentMethod)
                                }
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {options.paymentMethods.map((method) => (
                                        <SelectItem key={method} value={method}>
                                            {paymentMethodLabels[method]}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={form.errors.method} />
                        </div>

                        <div className="grid gap-2">
                            <Label>Statut</Label>
                            <Select
                                value={form.data.status}
                                onValueChange={(value) =>
                                    form.setData('status', value as PaymentStatus)
                                }
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {options.paymentStatuses.map((status) => (
                                        <SelectItem key={status} value={status}>
                                            {paymentStatusLabels[status]}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={form.errors.status} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="transaction_reference">
                                Reference
                            </Label>
                            <Input
                                id="transaction_reference"
                                value={form.data.transaction_reference}
                                onChange={(event) =>
                                    form.setData(
                                        'transaction_reference',
                                        event.target.value,
                                    )
                                }
                            />
                            <InputError
                                message={form.errors.transaction_reference}
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={
                                form.processing || invoice.status === 'paid'
                            }
                        >
                            Enregistrer
                        </Button>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
