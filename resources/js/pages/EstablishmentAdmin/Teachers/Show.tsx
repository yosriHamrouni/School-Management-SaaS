import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type Props = {
    teacher: {
        id: number;
        name: string;
        email: string;
        role: string;
        assignments: Array<{
            class_id: number;
            class_name: string;
            subjects: Array<{
                subject_id: number;
                subject_name: string;
            }>;
        }>;
    };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Teachers', href: '/establishment-admin/teachers' },
    { title: 'Details', href: '#' },
];

export default function TeachersShow({ teacher }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Teacher Details" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div className="rounded-xl border border-sidebar-border/70 bg-background p-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h1 className="text-2xl font-semibold">{teacher.name}</h1>
                            <p className="mt-2 text-sm text-muted-foreground">Teacher details.</p>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" asChild>
                                <Link href="/establishment-admin/teachers">Back</Link>
                            </Button>
                            <Button asChild>
                                <Link href={`/establishment-admin/teachers/${teacher.id}/edit`}>Edit</Link>
                            </Button>
                        </div>
                    </div>
                </div>
                <div className="grid gap-4 rounded-xl border border-sidebar-border/70 bg-background p-6 md:grid-cols-3">
                    <div className="rounded-lg border border-border p-4"><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Name</p><p className="mt-2 text-sm">{teacher.name}</p></div>
                    <div className="rounded-lg border border-border p-4"><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Email</p><p className="mt-2 text-sm">{teacher.email}</p></div>
                    <div className="rounded-lg border border-border p-4"><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Role</p><p className="mt-2 text-sm">{teacher.role}</p></div>
                </div>
                <div className="rounded-xl border border-sidebar-border/70 bg-background p-6">
                    <h2 className="text-lg font-semibold">Assigned classes and subjects</h2>
                    {teacher.assignments.length > 0 ? (
                        <div className="mt-4 grid gap-4">
                            {teacher.assignments.map((assignment) => (
                                <div
                                    key={assignment.class_id}
                                    className="rounded-lg border border-border p-4"
                                >
                                    <p className="text-sm font-semibold">
                                        Class: {assignment.class_name}
                                    </p>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {assignment.subjects.map((subject) => (
                                            <span
                                                key={subject.subject_id}
                                                className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground"
                                            >
                                                {subject.subject_name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="mt-3 text-sm text-muted-foreground">
                            No class-subject assignment is configured for this teacher yet.
                        </p>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
