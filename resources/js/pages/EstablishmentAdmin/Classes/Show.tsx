import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type Props = {
    schoolClass: {
        id: number;
        name: string;
        level_name: string | null;
        academic_year_name: string | null;
    };
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Classes',
        href: '/establishment-admin/classes',
    },
    {
        title: 'Details',
        href: '#',
    },
];

export default function ClassesShow({ schoolClass }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Class Details" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div className="rounded-xl border border-sidebar-border/70 bg-background p-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h1 className="text-2xl font-semibold">
                                {schoolClass.name}
                            </h1>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Class details.
                            </p>
                        </div>

                        <div className="flex gap-2">
                            <Button variant="outline" asChild>
                                <Link href="/establishment-admin/classes">
                                    Back
                                </Link>
                            </Button>
                            <Button asChild>
                                <Link
                                    href={`/establishment-admin/classes/${schoolClass.id}/edit`}
                                >
                                    Edit
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="rounded-xl border border-sidebar-border/70 bg-background p-6">
                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="rounded-lg border border-border p-4">
                            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                Name
                            </p>
                            <p className="mt-2 text-sm text-foreground">
                                {schoolClass.name}
                            </p>
                        </div>
                        <div className="rounded-lg border border-border p-4">
                            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                Level
                            </p>
                            <p className="mt-2 text-sm text-foreground">
                                {schoolClass.level_name ?? '-'}
                            </p>
                        </div>
                        <div className="rounded-lg border border-border p-4">
                            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                Academic Year
                            </p>
                            <p className="mt-2 text-sm text-foreground">
                                {schoolClass.academic_year_name ?? '-'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
