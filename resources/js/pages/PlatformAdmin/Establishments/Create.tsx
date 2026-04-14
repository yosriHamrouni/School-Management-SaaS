import { Head, Link, useForm } from '@inertiajs/react';
import KeyboardBackspaceRoundedIcon from '@mui/icons-material/KeyboardBackspaceRounded';
import { Button, Card, CardContent, Stack } from '@mui/material';
import EstablishmentForm from '@/components/platform-admin/establishment-form';
import PageHeader from '@/components/ui/page-header';
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

            <Stack spacing={3}>
                <PageHeader
                    eyebrow="Platform administration"
                    title="Create establishment"
                    description="Add a new establishment while keeping the existing Laravel and Inertia form flow intact."
                    actions={
                        <Button
                            component={Link}
                            href="/platform-admin/establishments"
                            variant="outlined"
                            startIcon={<KeyboardBackspaceRoundedIcon />}
                        >
                            Back to list
                        </Button>
                    }
                />

                <Card>
                    <CardContent sx={{ p: { xs: 3, md: 4 } }}>
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
                    </CardContent>
                </Card>
            </Stack>
        </AppLayout>
    );
}
