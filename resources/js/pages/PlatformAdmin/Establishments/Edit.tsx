import { Head, Link, useForm } from '@inertiajs/react';
import KeyboardBackspaceRoundedIcon from '@mui/icons-material/KeyboardBackspaceRounded';
import { Button, Card, CardContent, Stack } from '@mui/material';
import EstablishmentForm from '@/components/platform-admin/establishment-form';
import PageHeader from '@/components/ui/page-header';
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

            <Stack spacing={3}>
                <PageHeader
                    eyebrow="Platform administration"
                    title="Edit establishment"
                    description={`Update the information for ${establishment.name} with the existing persistence flow preserved.`}
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
                            submitLabel="Save changes"
                            setData={form.setData}
                            onSubmit={(event) => {
                                event.preventDefault();
                                form.put(
                                    `/platform-admin/establishments/${establishment.id}`,
                                );
                            }}
                        />
                    </CardContent>
                </Card>
            </Stack>
        </AppLayout>
    );
}
