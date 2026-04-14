import { Head, Link, useForm } from '@inertiajs/react';
import AcademicYearForm from '@/components/establishment-admin/academic-year-form';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type AcademicYearFormData = {
    name: string;
    start_date: string;
    end_date: string;
    status: 'active' | 'inactive';
    is_current: boolean;
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Academic Years',
        href: '/establishment-admin/academic-years',
    },
    {
        title: 'Create',
        href: '/establishment-admin/academic-years/create',
    },
];

const initialData: AcademicYearFormData = {
    name: '',
    start_date: '',
    end_date: '',
    status: 'active',
    is_current: false,
};

export default function AcademicYearsCreate() {
    const form = useForm<AcademicYearFormData>(initialData);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Academic Year" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div className="rounded-xl border border-sidebar-border/70 bg-background p-6">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-semibold">
                                Create Academic Year
                            </h1>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Add a new academic year for your establishment.
                            </p>
                        </div>

                        <Button variant="outline" asChild>
                            <Link href="/establishment-admin/academic-years">
                                Back to list
                            </Link>
                        </Button>
                    </div>
                </div>

                <div className="rounded-xl border border-sidebar-border/70 bg-background p-6">
                    <AcademicYearForm
                        data={form.data}
                        errors={form.errors}
                        processing={form.processing}
                        submitLabel="Create academic year"
                        setData={form.setData}
                        onSubmit={(event) => {
                            event.preventDefault();
                            form.post('/establishment-admin/academic-years');
                        }}
                    />
                </div>
            </div>
        </AppLayout>
    );
}
