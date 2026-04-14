import { Head, Link, useForm } from '@inertiajs/react';
import SubjectForm from '@/components/establishment-admin/subject-form';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Subjects',
        href: '/establishment-admin/subjects',
    },
    {
        title: 'Create',
        href: '/establishment-admin/subjects/create',
    },
];

export default function SubjectsCreate() {
    const form = useForm({
        name: '',
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Subject" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div className="rounded-xl border border-sidebar-border/70 bg-background p-6">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-semibold">
                                Create Subject
                            </h1>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Add a subject for your establishment.
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
                        submitLabel="Create subject"
                        setData={form.setData}
                        onSubmit={(event) => {
                            event.preventDefault();
                            form.post('/establishment-admin/subjects');
                        }}
                    />
                </div>
            </div>
        </AppLayout>
    );
}
