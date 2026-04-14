import { Head, Link, useForm } from '@inertiajs/react';
import TeacherForm from '@/components/establishment-admin/teacher-form';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type Props = {
    teacher: {
        id: number;
        name: string;
        email: string;
        assignments: string[];
    };
    assignmentOptions: Array<{
        class_id: number;
        class_name: string;
        subjects: Array<{
            key: string;
            subject_id: number;
            subject_name: string;
        }>;
    }>;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Teachers', href: '/establishment-admin/teachers' },
    { title: 'Edit', href: '#' },
];

export default function TeachersEdit({ teacher, assignmentOptions }: Props) {
    const form = useForm({
        name: teacher.name,
        email: teacher.email,
        password: '',
        password_confirmation: '',
        assignments: teacher.assignments ?? [],
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Teacher" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div className="rounded-xl border border-sidebar-border/70 bg-background p-6">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-semibold">Edit Teacher</h1>
                            <p className="mt-2 text-sm text-muted-foreground">Update {teacher.name}.</p>
                        </div>
                        <Button variant="outline" asChild>
                            <Link href="/establishment-admin/teachers">Back to list</Link>
                        </Button>
                    </div>
                </div>
                <div className="rounded-xl border border-sidebar-border/70 bg-background p-6">
                    <TeacherForm
                        data={form.data}
                        errors={form.errors}
                        processing={form.processing}
                        submitLabel="Save changes"
                        assignmentOptions={assignmentOptions}
                        passwordOptional
                        setData={form.setData}
                        onSubmit={(event) => {
                            event.preventDefault();
                            form.put(`/establishment-admin/teachers/${teacher.id}`);
                        }}
                    />
                </div>
            </div>
        </AppLayout>
    );
}
