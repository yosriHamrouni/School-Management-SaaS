import { Head, Link, useForm } from '@inertiajs/react';
import StudentForm from '@/components/establishment-admin/student-form';
import type { StudentFormData } from '@/components/establishment-admin/student-form';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type Option = {
    id: number;
    name: string;
};

type Props = {
    classes: Option[];
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Students', href: '/establishment-admin/students' },
    { title: 'Create', href: '/establishment-admin/students/create' },
];

export default function StudentsCreate({ classes }: Props) {
    const form = useForm<StudentFormData>({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        class_id: '',
        student_number: '',
        date_of_birth: '',
        gender: '',
        enrollment_date: '',
        status: '',
        photo_url: '',
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Student" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div className="rounded-xl border border-sidebar-border/70 bg-background p-6">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-semibold">Create Student</h1>
                            <p className="mt-2 text-sm text-muted-foreground">Add a student to your establishment.</p>
                        </div>
                        <Button variant="outline" asChild><Link href="/establishment-admin/students">Back to list</Link></Button>
                    </div>
                </div>
                <div className="rounded-xl border border-sidebar-border/70 bg-background p-6">
                    <StudentForm
                        data={form.data}
                        errors={form.errors}
                        processing={form.processing}
                        submitLabel="Create student"
                        classes={classes}
                        setData={form.setData}
                        onSubmit={(event) => {
                            event.preventDefault();
                            form.post('/establishment-admin/students');
                        }}
                    />
                </div>
            </div>
        </AppLayout>
    );
}
