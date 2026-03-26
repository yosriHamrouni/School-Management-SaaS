import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type Establishment = {
    id: number;
    name: string;
    code: string;
    type: string;
    address: string | null;
    city: string | null;
    phone: string | null;
    email: string | null;
    director_name: string | null;
    is_active: boolean;
    created_at: string | null;
    updated_at: string | null;
};

type Props = {
    establishment: Establishment;
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Platform Admin',
        href: '/platform-admin',
    },
    {
        title: 'Establishments',
        href: '/platform-admin/establishments',
    },
    {
        title: 'Details',
        href: '#',
    },
];

const fieldRows = (establishment: Establishment) => [
    { label: 'Name', value: establishment.name },
    { label: 'Code', value: establishment.code },
    { label: 'Type', value: establishment.type },
    { label: 'City', value: establishment.city ?? '-' },
    { label: 'Phone', value: establishment.phone ?? '-' },
    { label: 'Email', value: establishment.email ?? '-' },
    { label: 'Director', value: establishment.director_name ?? '-' },
    { label: 'Address', value: establishment.address ?? '-' },
    {
        label: 'Status',
        value: establishment.is_active ? 'Active' : 'Inactive',
    },
    { label: 'Created At', value: establishment.created_at ?? '-' },
    { label: 'Updated At', value: establishment.updated_at ?? '-' },
];

export default function EstablishmentsShow({ establishment }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Establishment Details" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div className="rounded-xl border border-sidebar-border/70 bg-background p-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h1 className="text-2xl font-semibold">
                                {establishment.name}
                            </h1>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Full establishment details.
                            </p>
                        </div>

                        <div className="flex gap-2">
                            <Button variant="outline" asChild>
                                <Link href="/platform-admin/establishments">
                                    Back
                                </Link>
                            </Button>
                            <Button asChild>
                                <Link
                                    href={`/platform-admin/establishments/${establishment.id}/edit`}
                                >
                                    Edit
                                </Link>
                            </Button>
                            <Button
                                variant="secondary"
                                onClick={() =>
                                    router.patch(
                                        `/platform-admin/establishments/${establishment.id}/toggle-status`,
                                    )
                                }
                            >
                                {establishment.is_active ? 'Disable' : 'Activate'}
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="rounded-xl border border-sidebar-border/70 bg-background p-6">
                    <div className="grid gap-4 md:grid-cols-2">
                        {fieldRows(establishment).map((field) => (
                            <div
                                key={field.label}
                                className="rounded-lg border border-border p-4"
                            >
                                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                    {field.label}
                                </p>
                                <p className="mt-2 text-sm text-foreground">
                                    {field.value}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
