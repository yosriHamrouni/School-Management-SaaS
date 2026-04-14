import { Head, Link, useForm } from '@inertiajs/react';
import LevelForm from '@/components/establishment-admin/level-form';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Levels',
        href: '/establishment-admin/levels',
    },
    {
        title: 'Create',
        href: '/establishment-admin/levels/create',
    },
];

export default function LevelsCreate() {
    const form = useForm({
        name: '',
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Level" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div className="rounded-xl border border-sidebar-border/70 bg-background p-6">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-semibold">
                                Create Level
                            </h1>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Add a level for your establishment.
                            </p>
                        </div>

                        <Button variant="outline" asChild>
                            <Link href="/establishment-admin/levels">
                                Back to list
                            </Link>
                        </Button>
                    </div>
                </div>

                <div className="rounded-xl border border-sidebar-border/70 bg-background p-6">
                    <LevelForm
                        data={form.data}
                        errors={form.errors}
                        processing={form.processing}
                        submitLabel="Create level"
                        setData={form.setData}
                        onSubmit={(event) => {
                            event.preventDefault();
                            form.post('/establishment-admin/levels');
                        }}
                    />
                </div>
            </div>
        </AppLayout>
    );
}
