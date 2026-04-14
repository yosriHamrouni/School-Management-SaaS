import { Head, Link, useForm } from '@inertiajs/react';
import ClassForm from '@/components/establishment-admin/class-form';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type Option = {
    id: number;
    name: string;
};

type Props = {
    schoolClass: {
        id: number;
        name: string;
        level_id: number;
        academic_year_id: number;
    };
    levels: Option[];
    academicYears: Option[];
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Classes',
        href: '/establishment-admin/classes',
    },
    {
        title: 'Edit',
        href: '#',
    },
];

export default function ClassesEdit({
    schoolClass,
    levels,
    academicYears,
}: Props) {
    const form = useForm({
        name: schoolClass.name,
        level_id: String(schoolClass.level_id),
        academic_year_id: String(schoolClass.academic_year_id),
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Class" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div className="rounded-xl border border-sidebar-border/70 bg-background p-6">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-semibold">Edit Class</h1>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Update {schoolClass.name}.
                            </p>
                        </div>

                        <Button variant="outline" asChild>
                            <Link href="/establishment-admin/classes">
                                Back to list
                            </Link>
                        </Button>
                    </div>
                </div>

                <div className="rounded-xl border border-sidebar-border/70 bg-background p-6">
                    <ClassForm
                        data={form.data}
                        errors={form.errors}
                        processing={form.processing}
                        submitLabel="Save changes"
                        levels={levels}
                        academicYears={academicYears}
                        setData={form.setData}
                        onSubmit={(event) => {
                            event.preventDefault();
                            form.put(
                                `/establishment-admin/classes/${schoolClass.id}`,
                            );
                        }}
                    />
                </div>
            </div>
        </AppLayout>
    );
}
