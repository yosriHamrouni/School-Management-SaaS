import { Head, Link, useForm } from '@inertiajs/react';
import LevelForm from '@/components/establishment-admin/level-form';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type Props = {
    level: {
        id: number;
        name: string;
    };
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Levels',
        href: '/establishment-admin/levels',
    },
    {
        title: 'Edit',
        href: '#',
    },
];

export default function LevelsEdit({ level }: Props) {
    const form = useForm({
        name: level.name,
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Level" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div className="rounded-xl border border-sidebar-border/70 bg-background p-6">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-semibold">Edit Level</h1>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Update {level.name}.
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
                        submitLabel="Save changes"
                        setData={form.setData}
                        onSubmit={(event) => {
                            event.preventDefault();
                            form.put(`/establishment-admin/levels/${level.id}`);
                        }}
                    />
                </div>
            </div>
        </AppLayout>
    );
}
