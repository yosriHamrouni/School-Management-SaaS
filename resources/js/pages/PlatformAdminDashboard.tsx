import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Platform Admin',
        href: '/platform-admin',
    },
];

export default function PlatformAdminDashboard() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Platform Admin" />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="rounded-xl border border-sidebar-border/70 bg-background p-6">
                    <h1 className="text-2xl font-semibold">Platform Admin Dashboard</h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Cette page est accessible uniquement aux utilisateurs ayant le role
                        platform_admin.
                    </p>
                </div>
            </div>
        </AppLayout>
    );
}
