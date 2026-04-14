import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type Props = {
    parent: {
        id: number;
        name: string;
        email: string;
        role: string;
        students: Array<{
            id: number | null;
            name: string | null;
            student_number: string | null;
        }>;
    };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Parents', href: '/establishment-admin/parents' },
    { title: 'Details', href: '#' },
];

export default function ParentsShow({ parent }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Parent Details" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div className="rounded-xl border border-sidebar-border/70 bg-background p-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h1 className="text-2xl font-semibold">{parent.name}</h1>
                            <p className="mt-2 text-sm text-muted-foreground">Parent details.</p>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" asChild><Link href="/establishment-admin/parents">Back</Link></Button>
                            <Button asChild><Link href={`/establishment-admin/parents/${parent.id}/edit`}>Edit</Link></Button>
                        </div>
                    </div>
                </div>
                <div className="grid gap-4 rounded-xl border border-sidebar-border/70 bg-background p-6 md:grid-cols-3">
                    <div className="rounded-lg border border-border p-4"><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Name</p><p className="mt-2 text-sm">{parent.name}</p></div>
                    <div className="rounded-lg border border-border p-4"><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Email</p><p className="mt-2 text-sm">{parent.email}</p></div>
                    <div className="rounded-lg border border-border p-4"><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Role</p><p className="mt-2 text-sm">{parent.role}</p></div>
                </div>
                <div className="rounded-xl border border-sidebar-border/70 bg-background p-6">
                    <h2 className="text-lg font-semibold">Linked students</h2>
                    <div className="mt-4 grid gap-3">
                        {parent.students.length > 0 ? parent.students.map((student) => (
                            <div key={`${student.id}-${student.student_number}`} className="rounded-lg border border-border p-4 text-sm">
                                {student.name ?? 'Unknown student'}
                                {student.student_number ? ` (${student.student_number})` : ''}
                            </div>
                        )) : (
                            <p className="text-sm text-muted-foreground">No linked students.</p>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
