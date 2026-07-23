import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type PaymentInvoice = {
    id: number;
    invoice_number: string;
    amount_paid: string;
    payment_date: string;
    payment_method: string | null;
    payment_status: string | null;
    generated_at: string;
    pdf_url: string;
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
};

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type PaginationData = {
    data: PaymentInvoice[];
    links: PaginationLink[];
};

type StudentOption = {
    id: number;
    name: string;
    student_number: string | null;
};

type FeeTypeOption = {
    id: number;
    name: string;
    type: string;
};

type PageProps = {
    filters: {
        student_id: string;
        fee_type_id: string;
        generated_from: string;
        generated_to: string;
    };
    paymentInvoices: PaginationData;
    options: {
        students: StudentOption[];
        feeTypes: FeeTypeOption[];
    };
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Invoices',
        href: '/finance/payment-invoices',
    },
];

function formatAmount(amount: string) {
    return new Intl.NumberFormat('fr-FR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(Number(amount));
}

function formatDateTime(value: string) {
    if (!value) {
        return '-';
    }

    return new Intl.DateTimeFormat('fr-FR', {
        dateStyle: 'short',
        timeStyle: 'short',
    }).format(new Date(value));
}

export default function PaymentInvoicesIndex({
    filters,
    paymentInvoices,
    options,
}: PageProps) {
    const [filterData, setFilterData] = useState(filters);

    const applyFilters = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        router.get('/finance/payment-invoices', filterData, {
            preserveState: true,
            replace: true,
        });
    };

    const resetFilters = () => {
        const emptyFilters = {
            student_id: '',
            fee_type_id: '',
            generated_from: '',
            generated_to: '',
        };

        setFilterData(emptyFilters);
        router.get('/finance/payment-invoices', {}, {
            preserveState: true,
            replace: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Invoices" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div className="rounded-xl border border-sidebar-border/70 bg-background p-6">
                    <h1 className="text-2xl font-semibold">
                        Historique des factures
                    </h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Consultez les factures generees automatiquement apres
                        les paiements et telechargez leur PDF.
                    </p>
                </div>

                <div className="rounded-xl border border-sidebar-border/70 bg-background p-4">
                    <form
                        onSubmit={applyFilters}
                        className="grid gap-3 md:grid-cols-4"
                    >
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
                            value={filterData.fee_type_id || 'all'}
                            onValueChange={(value) =>
                                setFilterData((current) => ({
                                    ...current,
                                    fee_type_id: value === 'all' ? '' : value,
                                }))
                            }
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Type de frais" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tous les frais</SelectItem>
                                {options.feeTypes.map((feeType) => (
                                    <SelectItem
                                        key={feeType.id}
                                        value={String(feeType.id)}
                                    >
                                        {feeType.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Input
                            type="date"
                            value={filterData.generated_from}
                            onChange={(event) =>
                                setFilterData((current) => ({
                                    ...current,
                                    generated_from: event.target.value,
                                }))
                            }
                        />

                        <Input
                            type="date"
                            value={filterData.generated_to}
                            onChange={(event) =>
                                setFilterData((current) => ({
                                    ...current,
                                    generated_to: event.target.value,
                                }))
                            }
                        />

                        <div className="flex gap-2 md:col-span-4">
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
                                        Numero
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                                        Eleve
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                                        Frais
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                                        Montant
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                                        Paiement
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                                        Generation
                                    </th>
                                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {paymentInvoices.data.length > 0 ? (
                                    paymentInvoices.data.map((invoice) => (
                                        <tr
                                            key={invoice.id}
                                            className="hover:bg-muted/30"
                                        >
                                            <td className="px-4 py-3 text-sm font-medium">
                                                {invoice.invoice_number}
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                <div>{invoice.student.name}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    {invoice.student.student_number ??
                                                        '-'}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                {invoice.fee_type.name}
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                {formatAmount(invoice.amount_paid)}
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                <div>{invoice.payment_date}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    {invoice.payment_method ?? '-'} -
                                                    {invoice.payment_status ?? '-'}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                {formatDateTime(invoice.generated_at)}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    asChild
                                                >
                                                    <a href={invoice.pdf_url}>
                                                        Telecharger PDF
                                                    </a>
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="px-4 py-8 text-center text-sm text-muted-foreground"
                                        >
                                            Aucune facture generee ne correspond
                                            aux criteres.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    {paymentInvoices.links.map((link, index) => (
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
        </AppLayout>
    );
}
