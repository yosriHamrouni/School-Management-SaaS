import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Admin Dashboard',
        href: '/admin',
    },
];

export default function AdminDashboard() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Admin Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="rounded-xl border border-sidebar-border/70 bg-white p-6 dark:border-sidebar-border dark:bg-neutral-950">
                    <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Cette page est accessible uniquement aux utilisateurs ayant le role admin.
                    </p>
                </div>
            </div>
        </AppLayout>
    );
}
