import { Head, Link, useForm } from '@inertiajs/react';
import EstablishmentForm from '@/components/platform-admin/establishment-form';
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
        title: 'Edit',
        href: '#',
    },
];

export default function EstablishmentsEdit({ establishment }: Props) {
    const form = useForm({
        name: establishment.name,
        code: establishment.code,
        type: establishment.type,
        address: establishment.address ?? '',
        city: establishment.city ?? '',
        phone: establishment.phone ?? '',
        email: establishment.email ?? '',
        director_name: establishment.director_name ?? '',
        is_active: establishment.is_active,
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Establishment" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div className="rounded-xl border border-sidebar-border/70 bg-background p-6">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-semibold">
                                Edit Establishment
                            </h1>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Update the information for {establishment.name}.
                            </p>
                        </div>

                        <Button variant="outline" asChild>
                            <Link href="/platform-admin/establishments">
                                Back to list
                            </Link>
                        </Button>
                    </div>
                </div>

                <div className="rounded-xl border border-sidebar-border/70 bg-background p-6">
                    <EstablishmentForm
                        data={form.data}
                        errors={form.errors}
                        processing={form.processing}
                        submitLabel="Save changes"
                        setData={form.setData}
                        onSubmit={(event) => {
                            event.preventDefault();
                            form.put(
                                `/platform-admin/establishments/${establishment.id}`,
                            );
                        }}
                    />
                </div>
            </div>
        </AppLayout>
    );
}
