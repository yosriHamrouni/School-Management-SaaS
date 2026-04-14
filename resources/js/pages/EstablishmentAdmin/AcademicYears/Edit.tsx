import { Head, Link, useForm } from '@inertiajs/react';
import AcademicYearForm from '@/components/establishment-admin/academic-year-form';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type AcademicYear = {
    id: number;
    name: string;
    start_date: string;
    end_date: string;
    status: 'active' | 'inactive';
    is_current: boolean;
};

type Props = {
    academicYear: AcademicYear;
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Academic Years',
        href: '/establishment-admin/academic-years',
    },
    {
        title: 'Edit',
        href: '#',
    },
];

export default function AcademicYearsEdit({ academicYear }: Props) {
    const form = useForm({
        name: academicYear.name,
        start_date: academicYear.start_date,
        end_date: academicYear.end_date,
        status: academicYear.status,
        is_current: academicYear.is_current,
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Academic Year" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div className="rounded-xl border border-sidebar-border/70 bg-background p-6">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-semibold">
                                Edit Academic Year
                            </h1>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Update {academicYear.name}.
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
                        submitLabel="Save changes"
                        setData={form.setData}
                        onSubmit={(event) => {
                            event.preventDefault();
                            form.put(
                                `/establishment-admin/academic-years/${academicYear.id}`,
                            );
                        }}
                    />
                </div>
            </div>
        </AppLayout>
    );
}
