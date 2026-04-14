import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type AcademicYear = {
    id: number;
    name: string;
    start_date: string;
    end_date: string;
    status: string;
    is_current: boolean;
    created_at: string | null;
    updated_at: string | null;
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
        title: 'Details',
        href: '#',
    },
];

const detailRows = (academicYear: AcademicYear) => [
    { label: 'Name', value: academicYear.name },
    { label: 'Start Date', value: academicYear.start_date },
    { label: 'End Date', value: academicYear.end_date },
    { label: 'Status', value: academicYear.status },
    {
        label: 'Current Year',
        value: academicYear.is_current ? 'Yes' : 'No',
    },
    { label: 'Created At', value: academicYear.created_at ?? '-' },
    { label: 'Updated At', value: academicYear.updated_at ?? '-' },
];

export default function AcademicYearsShow({ academicYear }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Academic Year Details" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div className="rounded-xl border border-sidebar-border/70 bg-background p-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h1 className="text-2xl font-semibold">
                                {academicYear.name}
                            </h1>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Academic year details for your establishment.
                            </p>
                        </div>

                        <div className="flex gap-2">
                            <Button variant="outline" asChild>
                                <Link href="/establishment-admin/academic-years">
                                    Back
                                </Link>
                            </Button>
                            <Button asChild>
                                <Link
                                    href={`/establishment-admin/academic-years/${academicYear.id}/edit`}
                                >
                                    Edit
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="rounded-xl border border-sidebar-border/70 bg-background p-6">
                    <div className="grid gap-4 md:grid-cols-2">
                        {detailRows(academicYear).map((row) => (
                            <div
                                key={row.label}
                                className="rounded-lg border border-border p-4"
                            >
                                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                    {row.label}
                                </p>
                                <p className="mt-2 text-sm text-foreground">
                                    {row.value}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
