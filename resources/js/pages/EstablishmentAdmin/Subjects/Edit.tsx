import { Head, Link, useForm } from '@inertiajs/react';
import SubjectForm from '@/components/establishment-admin/subject-form';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type Props = {
    subject: {
        id: number;
        name: string;
    };
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Subjects',
        href: '/establishment-admin/subjects',
    },
    {
        title: 'Edit',
        href: '#',
    },
];

export default function SubjectsEdit({ subject }: Props) {
    const form = useForm({
        name: subject.name,
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Subject" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div className="rounded-xl border border-sidebar-border/70 bg-background p-6">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-semibold">
                                Edit Subject
                            </h1>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Update {subject.name}.
                            </p>
                        </div>

                        <Button variant="outline" asChild>
                            <Link href="/establishment-admin/subjects">
                                Back to list
                            </Link>
                        </Button>
                    </div>
                </div>

                <div className="rounded-xl border border-sidebar-border/70 bg-background p-6">
                    <SubjectForm
                        data={form.data}
                        errors={form.errors}
                        processing={form.processing}
                        submitLabel="Save changes"
                        setData={form.setData}
                        onSubmit={(event) => {
                            event.preventDefault();
                            form.put(`/establishment-admin/subjects/${subject.id}`);
                        }}
                    />
                </div>
            </div>
        </AppLayout>
    );
}
