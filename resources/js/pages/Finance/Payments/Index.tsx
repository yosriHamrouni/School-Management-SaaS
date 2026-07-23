import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
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

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type PaginationData = {
    data: Invoice[];
    links: PaginationLink[];
};

type StudentOption = {
    id: number;
    name: string;
    student_number: string | null;
};

type AcademicYearOption = {
    id: number;
    name: string;
};

type PageProps = {
    filters: {
        status: string;
        student_id: string;
        academic_year_id: string;
        due_from: string;
        due_to: string;
    };
    invoices: PaginationData;
    options: {
        invoiceStatuses: InvoiceStatus[];
        paymentMethods: PaymentMethod[];
        paymentStatuses: PaymentStatus[];
        students: StudentOption[];
        academicYears: AcademicYearOption[];
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

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Payments',
        href: '/finance/payments',
    },
];

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

export default function PaymentsIndex({
    filters,
    invoices,
    options,
}: PageProps) {
    const { flash } = usePage<PageProps>().props;
    const [filterData, setFilterData] = useState(filters);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

    const form = useForm<PaymentFormData>({
        amount: '',
        payment_date: today(),
        method: 'cash',
        status: 'completed',
        transaction_reference: '',
    });

    const applyFilters = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        router.get('/finance/payments', filterData, {
            preserveState: true,
            replace: true,
        });
    };

    const resetFilters = () => {
        const emptyFilters = {
            status: '',
            student_id: '',
            academic_year_id: '',
            due_from: '',
            due_to: '',
        };

        setFilterData(emptyFilters);
        router.get('/finance/payments', {}, { preserveState: true, replace: true });
    };

    const openPaymentDialog = (invoice: Invoice) => {
        setSelectedInvoice(invoice);
        form.clearErrors();
        form.setData({
            amount: invoice.remaining_amount,
            payment_date: today(),
            method: 'cash',
            status: 'completed',
            transaction_reference: '',
        });
        setPaymentDialogOpen(true);
    };

    const submitPayment = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!selectedInvoice) {
            return;
        }

        form.post(`/finance/invoices/${selectedInvoice.id}/payments`, {
            preserveScroll: true,
            onSuccess: () => {
                setPaymentDialogOpen(false);
                setSelectedInvoice(null);
                form.reset();
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Payments" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div className="rounded-xl border border-sidebar-border/70 bg-background p-6">
                    <h1 className="text-2xl font-semibold">
                        Suivi des paiements
                    </h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Suivez les factures, les montants payes, les restes dus
                        et les retards de paiement.
                    </p>
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

                <div className="rounded-xl border border-sidebar-border/70 bg-background p-4">
                    <form
                        onSubmit={applyFilters}
                        className="grid gap-3 md:grid-cols-5"
                    >
                        <Select
                            value={filterData.status || 'all'}
                            onValueChange={(value) =>
                                setFilterData((current) => ({
                                    ...current,
                                    status: value === 'all' ? '' : value,
                                }))
                            }
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Statut" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tous les statuts</SelectItem>
                                {options.invoiceStatuses.map((status) => (
                                    <SelectItem key={status} value={status}>
                                        {invoiceStatusLabels[status]}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select
                            value={filterData.student_id || 'all'}
                            onValueChange={(value) =>
                                setFilterData((current) => ({
                                    ...current,
                                    student_id: value === 'all' ? '' : value,
                                }))
                            }
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Eleve" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tous les eleves</SelectItem>
                                {options.students.map((student) => (
                                    <SelectItem
                                        key={student.id}
                                        value={String(student.id)}
                                    >
                                        {student.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select
                            value={filterData.academic_year_id || 'all'}
                            onValueChange={(value) =>
                                setFilterData((current) => ({
                                    ...current,
                                    academic_year_id:
                                        value === 'all' ? '' : value,
                                }))
                            }
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Annee scolaire" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Toutes les annees</SelectItem>
                                {options.academicYears.map((academicYear) => (
                                    <SelectItem
                                        key={academicYear.id}
                                        value={String(academicYear.id)}
                                    >
                                        {academicYear.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Input
                            type="date"
                            value={filterData.due_from}
                            onChange={(event) =>
                                setFilterData((current) => ({
                                    ...current,
                                    due_from: event.target.value,
                                }))
                            }
                        />

                        <Input
                            type="date"
                            value={filterData.due_to}
                            onChange={(event) =>
                                setFilterData((current) => ({
                                    ...current,
                                    due_to: event.target.value,
                                }))
                            }
                        />

                        <div className="flex gap-2 md:col-span-5">
                            <Button type="submit">Filtrer</Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={resetFilters}
                            >
                                Reinitialiser
                            </Button>
                        </div>
                    </form>
                </div>

                <div className="overflow-hidden rounded-xl border border-sidebar-border/70 bg-background">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-border">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                                        Facture
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                                        Eleve
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                                        Frais
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                                        Total
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                                        Paye
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                                        Reste
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                                        Echeance
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                                        Statut
                                    </th>
                                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {invoices.data.length > 0 ? (
                                    invoices.data.map((invoice) => (
                                        <tr
                                            key={invoice.id}
                                            className="hover:bg-muted/30"
                                        >
                                            <td className="px-4 py-3 text-sm font-medium">
                                                {invoice.invoice_number}
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                {invoice.student.name}
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                {invoice.fee_type.name}
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                {formatAmount(invoice.amount)}
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                {formatAmount(invoice.total_paid)}
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                {formatAmount(
                                                    invoice.remaining_amount,
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                {invoice.due_date}
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                <Badge
                                                    variant={statusVariant(
                                                        invoice.status,
                                                    )}
                                                >
                                                    {
                                                        invoiceStatusLabels[
                                                            invoice.status
                                                        ]
                                                    }
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        asChild
                                                    >
                                                        <Link
                                                            href={`/finance/invoices/${invoice.id}`}
                                                        >
                                                            Voir detail
                                                        </Link>
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        disabled={
                                                            invoice.status ===
                                                            'paid'
                                                        }
                                                        onClick={() =>
                                                            openPaymentDialog(
                                                                invoice,
                                                            )
                                                        }
                                                    >
                                                        Enregistrer paiement
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={9}
                                            className="px-4 py-8 text-center text-sm text-muted-foreground"
                                        >
                                            Aucune facture ne correspond aux
                                            criteres.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    {invoices.links.map((link, index) => (
                        <Button
                            key={`${link.label}-${index}`}
                            variant={link.active ? 'default' : 'outline'}
                            size="sm"
                            disabled={!link.url}
                            asChild={Boolean(link.url)}
                        >
                            {link.url ? (
                                <Link
                                    href={link.url}
                                    preserveScroll
                                    dangerouslySetInnerHTML={{
                                        __html: link.label,
                                    }}
                                />
                            ) : (
                                <span
                                    dangerouslySetInnerHTML={{
                                        __html: link.label,
                                    }}
                                />
                            )}
                        </Button>
                    ))}
                </div>
            </div>

            <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Enregistrer un paiement</DialogTitle>
                        <DialogDescription>
                            {selectedInvoice
                                ? `Facture ${selectedInvoice.invoice_number} - reste du ${formatAmount(selectedInvoice.remaining_amount)}`
                                : null}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedInvoice ? (
                        <div className="grid gap-5">
                            <form onSubmit={submitPayment} className="grid gap-4">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="grid gap-2">
                                        <Label htmlFor="amount">Montant</Label>
                                        <Input
                                            id="amount"
                                            type="number"
                                            min="0.01"
                                            step="0.01"
                                            value={form.data.amount}
                                            onChange={(event) =>
                                                form.setData(
                                                    'amount',
                                                    event.target.value,
                                                )
                                            }
                                        />
                                        <InputError message={form.errors.amount} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="payment_date">
                                            Date de paiement
                                        </Label>
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
                                        <InputError
                                            message={form.errors.payment_date}
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="grid gap-2">
                                        <Label>Methode</Label>
                                        <Select
                                            value={form.data.method}
                                            onValueChange={(value) =>
                                                form.setData(
                                                    'method',
                                                    value as PaymentMethod,
                                                )
                                            }
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {options.paymentMethods.map(
                                                    (method) => (
                                                        <SelectItem
                                                            key={method}
                                                            value={method}
                                                        >
                                                            {
                                                                paymentMethodLabels[
                                                                    method
                                                                ]
                                                            }
                                                        </SelectItem>
                                                    ),
                                                )}
                                            </SelectContent>
                                        </Select>
                                        <InputError message={form.errors.method} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label>Statut</Label>
                                        <Select
                                            value={form.data.status}
                                            onValueChange={(value) =>
                                                form.setData(
                                                    'status',
                                                    value as PaymentStatus,
                                                )
                                            }
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {options.paymentStatuses.map(
                                                    (status) => (
                                                        <SelectItem
                                                            key={status}
                                                            value={status}
                                                        >
                                                            {
                                                                paymentStatusLabels[
                                                                    status
                                                                ]
                                                            }
                                                        </SelectItem>
                                                    ),
                                                )}
                                            </SelectContent>
                                        </Select>
                                        <InputError message={form.errors.status} />
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="transaction_reference">
                                        Reference de transaction
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

                                <DialogFooter>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() =>
                                            setPaymentDialogOpen(false)
                                        }
                                    >
                                        Annuler
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={form.processing}
                                    >
                                        Enregistrer
                                    </Button>
                                </DialogFooter>
                            </form>

                            <div className="rounded-md border">
                                <div className="border-b px-4 py-3 text-sm font-medium">
                                    Paiements deja enregistres
                                </div>
                                {selectedInvoice.payments.length > 0 ? (
                                    <div className="divide-y">
                                        {selectedInvoice.payments.map(
                                            (payment) => (
                                                <div
                                                    key={payment.id}
                                                    className="grid gap-1 px-4 py-3 text-sm md:grid-cols-4"
                                                >
                                                    <span>
                                                        {formatAmount(
                                                            payment.amount,
                                                        )}
                                                    </span>
                                                    <span>
                                                        {
                                                            paymentMethodLabels[
                                                                payment.method
                                                            ]
                                                        }
                                                    </span>
                                                    <span>
                                                        {
                                                            paymentStatusLabels[
                                                                payment.status
                                                            ]
                                                        }
                                                    </span>
                                                    <span>
                                                        {payment.payment_date}
                                                    </span>
                                                </div>
                                            ),
                                        )}
                                    </div>
                                ) : (
                                    <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                                        Aucun paiement enregistre.
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : null}
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
