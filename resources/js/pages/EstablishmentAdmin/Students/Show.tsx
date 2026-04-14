import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type Props = {
    student: {
        id: number;
        name: string;
        email: string;
        class_name: string | null;
        student_number: string | null;
        date_of_birth: string | null;
        gender: string | null;
        enrollment_date: string | null;
        status: string | null;
        photo_url: string | null;
        role: string;
    };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Students', href: '/establishment-admin/students' },
    { title: 'Details', href: '#' },
];

export default function StudentsShow({ student }: Props) {
    const rows = [
        ['Name', student.name],
        ['Email', student.email],
        ['Class', student.class_name ?? '-'],
        ['Student Number', student.student_number ?? '-'],
        ['Date of Birth', student.date_of_birth ?? '-'],
        ['Gender', student.gender ?? '-'],
        ['Enrollment Date', student.enrollment_date ?? '-'],
        ['Status', student.status ?? '-'],
        ['Photo URL', student.photo_url ?? '-'],
        ['Role', student.role],
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Student Details" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div className="rounded-xl border border-sidebar-border/70 bg-background p-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h1 className="text-2xl font-semibold">{student.name}</h1>
                            <p className="mt-2 text-sm text-muted-foreground">Student details.</p>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" asChild><Link href="/establishment-admin/students">Back</Link></Button>
                            <Button asChild><Link href={`/establishment-admin/students/${student.id}/edit`}>Edit</Link></Button>
                        </div>
                    </div>
                </div>
                <div className="grid gap-4 rounded-xl border border-sidebar-border/70 bg-background p-6 md:grid-cols-3">
                    {rows.map(([label, value]) => (
                        <div key={label} className="rounded-lg border border-border p-4">
                            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
                            <p className="mt-2 text-sm">{value}</p>
                        </div>
                    ))}
                </div>
            </div>
        </AppLayout>
    );
}
