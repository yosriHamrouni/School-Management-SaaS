import { Head, Link, useForm } from '@inertiajs/react';
import EstablishmentForm from '@/components/platform-admin/establishment-form';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type EstablishmentFormData = {
    name: string;
    code: string;
    type: string;
    address: string;
    city: string;
    phone: string;
    email: string;
    director_name: string;
    is_active: boolean;
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
        title: 'Create',
        href: '/platform-admin/establishments/create',
    },
];

const initialData: EstablishmentFormData = {
    name: '',
    code: '',
    type: '',
    address: '',
    city: '',
    phone: '',
    email: '',
    director_name: '',
    is_active: true,
};

export default function EstablishmentsCreate() {
    const form = useForm<EstablishmentFormData>(initialData);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Establishment" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div className="rounded-xl border border-sidebar-border/70 bg-background p-6">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-semibold">
                                Create Establishment
                            </h1>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Add a new establishment to the platform.
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
                        submitLabel="Create establishment"
                        setData={form.setData}
                        onSubmit={(event) => {
                            event.preventDefault();
                            form.post('/platform-admin/establishments');
                        }}
                    />
                </div>
            </div>
        </AppLayout>
    );
}
