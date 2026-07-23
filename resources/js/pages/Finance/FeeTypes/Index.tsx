import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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

type FeeType = {
    id: number;
    name: string;
    type: FeeTypeType;
    description: string | null;
    amount: string;
    frequency: FeeFrequency;
    is_active: boolean;
};

type FeeTypeType =
    | 'registration'
    | 'tuition'
    | 'transport'
    | 'canteen'
    | 'activity'
    | 'other';

type FeeFrequency = 'once' | 'monthly' | 'quarterly' | 'yearly';

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type PaginationData = {
    data: FeeType[];
    links: PaginationLink[];
};

type FeeTypeFormData = {
    name: string;
    type: FeeTypeType;
    description: string;
    amount: string;
    frequency: FeeFrequency;
    is_active: boolean;
};

type PageProps = {
    filters: {
        search: string;
    };
    feeTypes: PaginationData;
    options: {
        types: FeeTypeType[];
        frequencies: FeeFrequency[];
    };
    flash?: {
        success?: string | null;
        error?: string | null;
    };
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'School Fees',
        href: '/finance/fee-types',
    },
];

const typeLabels: Record<FeeTypeType, string> = {
    registration: 'Inscription',
    tuition: 'Mensualite',
    transport: 'Transport',
    canteen: 'Cantine',
    activity: 'Activite',
    other: 'Autre',
};

const frequencyLabels: Record<FeeFrequency, string> = {
    once: 'Une fois',
    monthly: 'Mensuelle',
    quarterly: 'Trimestrielle',
    yearly: 'Annuelle',
};

function formatAmount(amount: string) {
    return new Intl.NumberFormat('fr-FR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(Number(amount));
}

export default function FeeTypesIndex({
    filters,
    feeTypes,
    options,
}: PageProps) {
    const { flash } = usePage<PageProps>().props;
    const [search, setSearch] = useState(filters.search ?? '');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingFeeType, setEditingFeeType] = useState<FeeType | null>(null);

    const form = useForm<FeeTypeFormData>({
        name: '',
        type: 'tuition',
        description: '',
        amount: '0',
        frequency: 'monthly',
        is_active: true,
    });

    const submitSearch = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        router.get(
            '/finance/fee-types',
            { search },
            { preserveState: true, replace: true },
        );
    };

    const openCreateDialog = () => {
        setEditingFeeType(null);
        form.clearErrors();
        form.setData({
            name: '',
            type: 'tuition',
            description: '',
            amount: '0',
            frequency: 'monthly',
            is_active: true,
        });
        setDialogOpen(true);
    };

    const openEditDialog = (feeType: FeeType) => {
        setEditingFeeType(feeType);
        form.clearErrors();
        form.setData({
            name: feeType.name,
            type: feeType.type,
            description: feeType.description ?? '',
            amount: feeType.amount,
            frequency: feeType.frequency,
            is_active: feeType.is_active,
        });
        setDialogOpen(true);
    };

    const submitForm = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const options = {
            preserveScroll: true,
            onSuccess: () => {
                setDialogOpen(false);
                setEditingFeeType(null);
                form.reset();
            },
        };

        if (editingFeeType) {
            form.put(`/finance/fee-types/${editingFeeType.id}`, options);

            return;
        }

        form.post('/finance/fee-types', options);
    };

    const deactivateFeeType = (feeType: FeeType) => {
        if (
            !window.confirm(
                `Desactiver le frais "${feeType.name}" ? Il restera visible dans la liste.`,
            )
        ) {
            return;
        }

        router.delete(`/finance/fee-types/${feeType.id}`, {
            preserveScroll: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="School Fees" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div className="flex flex-col gap-4 rounded-xl border border-sidebar-border/70 bg-background p-6 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">
                            Configuration des frais scolaires
                        </h1>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Configurez les frais utilises par la facturation de
                            votre etablissement.
                        </p>
                    </div>

                    <Button type="button" onClick={openCreateDialog}>
                        Ajouter un frais
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

                <div className="rounded-xl border border-sidebar-border/70 bg-background p-4">
                    <form
                        onSubmit={submitSearch}
                        className="flex flex-col gap-3 md:flex-row"
                    >
                        <Input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Rechercher par nom ou type"
                            className="w-full"
                        />
                        <div className="flex gap-2">
                            <Button type="submit">Rechercher</Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setSearch('');
                                    router.get(
                                        '/finance/fee-types',
                                        {},
                                        { preserveState: true, replace: true },
                                    );
                                }}
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
                                        Nom
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                                        Type
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                                        Montant
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                                        Frequence
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                                        Description
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
                                {feeTypes.data.length > 0 ? (
                                    feeTypes.data.map((feeType) => (
                                        <tr
                                            key={feeType.id}
                                            className="hover:bg-muted/30"
                                        >
                                            <td className="px-4 py-3 text-sm font-medium">
                                                {feeType.name}
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                {typeLabels[feeType.type]}
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                {formatAmount(feeType.amount)}
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                {
                                                    frequencyLabels[
                                                        feeType.frequency
                                                    ]
                                                }
                                            </td>
                                            <td className="max-w-xs px-4 py-3 text-sm text-muted-foreground">
                                                <span className="line-clamp-2">
                                                    {feeType.description || '-'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                <Badge
                                                    variant={
                                                        feeType.is_active
                                                            ? 'default'
                                                            : 'secondary'
                                                    }
                                                >
                                                    {feeType.is_active
                                                        ? 'Actif'
                                                        : 'Inactif'}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() =>
                                                            openEditDialog(
                                                                feeType,
                                                            )
                                                        }
                                                    >
                                                        Modifier
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="destructive"
                                                        size="sm"
                                                        disabled={
                                                            !feeType.is_active
                                                        }
                                                        onClick={() =>
                                                            deactivateFeeType(
                                                                feeType,
                                                            )
                                                        }
                                                    >
                                                        Desactiver
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="px-4 py-8 text-center text-sm text-muted-foreground"
                                        >
                                            Aucun frais scolaire n'est encore
                                            configure.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    {feeTypes.links.map((link, index) => (
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

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editingFeeType
                                ? 'Modifier un frais'
                                : 'Ajouter un frais'}
                        </DialogTitle>
                        <DialogDescription>
                            Les frais sont automatiquement rattaches a votre
                            etablissement.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={submitForm} className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Nom</Label>
                            <Input
                                id="name"
                                value={form.data.name}
                                onChange={(event) =>
                                    form.setData('name', event.target.value)
                                }
                            />
                            <InputError message={form.errors.name} />
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="grid gap-2">
                                <Label>Type</Label>
                                <Select
                                    value={form.data.type}
                                    onValueChange={(value) =>
                                        form.setData(
                                            'type',
                                            value as FeeTypeType,
                                        )
                                    }
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {options.types.map((type) => (
                                            <SelectItem
                                                key={type}
                                                value={type}
                                            >
                                                {typeLabels[type]}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={form.errors.type} />
                            </div>

                            <div className="grid gap-2">
                                <Label>Frequence</Label>
                                <Select
                                    value={form.data.frequency}
                                    onValueChange={(value) =>
                                        form.setData(
                                            'frequency',
                                            value as FeeFrequency,
                                        )
                                    }
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {options.frequencies.map(
                                            (frequency) => (
                                                <SelectItem
                                                    key={frequency}
                                                    value={frequency}
                                                >
                                                    {
                                                        frequencyLabels[
                                                            frequency
                                                        ]
                                                    }
                                                </SelectItem>
                                            ),
                                        )}
                                    </SelectContent>
                                </Select>
                                <InputError message={form.errors.frequency} />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="amount">Montant</Label>
                            <Input
                                id="amount"
                                type="number"
                                min="0"
                                step="0.01"
                                value={form.data.amount}
                                onChange={(event) =>
                                    form.setData('amount', event.target.value)
                                }
                            />
                            <InputError message={form.errors.amount} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="description">Description</Label>
                            <textarea
                                id="description"
                                value={form.data.description}
                                onChange={(event) =>
                                    form.setData(
                                        'description',
                                        event.target.value,
                                    )
                                }
                                className="border-input focus-visible:border-ring focus-visible:ring-ring/50 min-h-24 rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
                            />
                            <InputError message={form.errors.description} />
                        </div>

                        <label className="flex items-center gap-3 text-sm">
                            <Checkbox
                                checked={form.data.is_active}
                                onCheckedChange={(checked) =>
                                    form.setData('is_active', checked === true)
                                }
                            />
                            Frais actif
                        </label>
                        <InputError message={form.errors.is_active} />

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setDialogOpen(false)}
                            >
                                Annuler
                            </Button>
                            <Button type="submit" disabled={form.processing}>
                                {editingFeeType
                                    ? 'Enregistrer'
                                    : 'Creer le frais'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
