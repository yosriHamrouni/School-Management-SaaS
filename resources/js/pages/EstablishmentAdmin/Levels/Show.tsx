import { Head, Link } from '@inertiajs/react';
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
        title: 'Details',
        href: '#',
    },
];

export default function LevelsShow({ level }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Level Details" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div className="rounded-xl border border-sidebar-border/70 bg-background p-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h1 className="text-2xl font-semibold">
                                {level.name}
                            </h1>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Level details.
                            </p>
                        </div>

                        <div className="flex gap-2">
                            <Button variant="outline" asChild>
                                <Link href="/establishment-admin/levels">
                                    Back
                                </Link>
                            </Button>
                            <Button asChild>
                                <Link
                                    href={`/establishment-admin/levels/${level.id}/edit`}
                                >
                                    Edit
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="rounded-xl border border-sidebar-border/70 bg-background p-6">
                    <div className="rounded-lg border border-border p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            Name
                        </p>
                        <p className="mt-2 text-sm text-foreground">
                            {level.name}
                        </p>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
