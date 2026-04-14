import { Head, Link, useForm } from '@inertiajs/react';
import ParentForm from '@/components/establishment-admin/parent-form';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type StudentOption = {
    id: number;
    name: string;
    student_number: string | null;
};

type Props = {
    parent: {
        id: number;
        name: string;
        email: string;
        student_ids: number[];
    };
    students: StudentOption[];
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Parents', href: '/establishment-admin/parents' },
    { title: 'Edit', href: '#' },
];

export default function ParentsEdit({ parent, students }: Props) {
    const form = useForm({
        name: parent.name,
        email: parent.email,
        password: '',
        password_confirmation: '',
        student_ids: parent.student_ids,
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Parent" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div className="rounded-xl border border-sidebar-border/70 bg-background p-6">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-semibold">Edit Parent</h1>
                            <p className="mt-2 text-sm text-muted-foreground">Update {parent.name}.</p>
                        </div>
                        <Button variant="outline" asChild><Link href="/establishment-admin/parents">Back to list</Link></Button>
                    </div>
                </div>
                <div className="rounded-xl border border-sidebar-border/70 bg-background p-6">
                    <ParentForm data={form.data} errors={form.errors} processing={form.processing} submitLabel="Save changes" passwordOptional students={students} setData={form.setData} onSubmit={(event) => { event.preventDefault(); form.put(`/establishment-admin/parents/${parent.id}`); }} />
                </div>
            </div>
        </AppLayout>
    );
}
