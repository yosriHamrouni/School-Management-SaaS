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
    students: StudentOption[];
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Parents', href: '/establishment-admin/parents' },
    { title: 'Create', href: '/establishment-admin/parents/create' },
];

export default function ParentsCreate({ students }: Props) {
    const form = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        student_ids: [] as number[],
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Parent" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div className="rounded-xl border border-sidebar-border/70 bg-background p-6">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-semibold">Create Parent</h1>
                            <p className="mt-2 text-sm text-muted-foreground">Add a parent to your establishment.</p>
                        </div>
                        <Button variant="outline" asChild><Link href="/establishment-admin/parents">Back to list</Link></Button>
                    </div>
                </div>
                <div className="rounded-xl border border-sidebar-border/70 bg-background p-6">
                    <ParentForm data={form.data} errors={form.errors} processing={form.processing} submitLabel="Create parent" students={students} setData={form.setData} onSubmit={(event) => { event.preventDefault(); form.post('/establishment-admin/parents'); }} />
                </div>
            </div>
        </AppLayout>
    );
}
