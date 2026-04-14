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
    student: {
        id: number;
        name: string;
        email: string;
        class_id: number | null;
        student_number: string | null;
        date_of_birth: string | null;
        gender: string | null;
        enrollment_date: string | null;
        status: string | null;
        photo_url: string | null;
    };
    classes: Option[];
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Students', href: '/establishment-admin/students' },
    { title: 'Edit', href: '#' },
];

export default function StudentsEdit({ student, classes }: Props) {
    const form = useForm<StudentFormData>({
        name: student.name,
        email: student.email,
        password: '',
        password_confirmation: '',
        class_id: student.class_id ? String(student.class_id) : '',
        student_number: student.student_number ?? '',
        date_of_birth: student.date_of_birth ?? '',
        gender: student.gender ?? '',
        enrollment_date: student.enrollment_date ?? '',
        status: student.status ?? '',
        photo_url: student.photo_url ?? '',
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Student" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div className="rounded-xl border border-sidebar-border/70 bg-background p-6">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-semibold">Edit Student</h1>
                            <p className="mt-2 text-sm text-muted-foreground">Update {student.name}.</p>
                        </div>
                        <Button variant="outline" asChild><Link href="/establishment-admin/students">Back to list</Link></Button>
                    </div>
                </div>
                <div className="rounded-xl border border-sidebar-border/70 bg-background p-6">
                    <StudentForm
                        data={form.data}
                        errors={form.errors}
                        processing={form.processing}
                        submitLabel="Save changes"
                        classes={classes}
                        passwordOptional
                        setData={form.setData}
                        onSubmit={(event) => {
                            event.preventDefault();
                            form.put(`/establishment-admin/students/${student.id}`);
                        }}
                    />
                </div>
            </div>
        </AppLayout>
    );
}
