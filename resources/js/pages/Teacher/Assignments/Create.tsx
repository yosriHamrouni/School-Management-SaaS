import { Head, Link, useForm } from '@inertiajs/react';
import AssignmentForm from '@/components/assignments/assignment-form';
import type { AssignmentFormData } from '@/components/assignments/assignment-form';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type AssignmentOption = {
    class_id: number;
    subject_id: number;
    label: string;
};

type Props = {
    assignmentOptions: AssignmentOption[];
    activeAcademicYear?: {
        id: number;
        name: string;
    } | null;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Assignments', href: '/teacher/assignments' },
    { title: 'Create', href: '/teacher/assignments/create' },
];

export default function TeacherAssignmentsCreate({
    assignmentOptions,
    activeAcademicYear,
}: Props) {
    const form = useForm<AssignmentFormData>({
        class_id: '',
        subject_id: '',
        title: '',
        description: '',
        due_date: '',
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Assignment" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div className="rounded-xl border border-sidebar-border/70 bg-background p-6">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-semibold">Create Assignment</h1>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Publish a new assignment for one of your assigned classes and subjects.
                            </p>
                        </div>
                        <Button variant="outline" asChild>
                            <Link href="/teacher/assignments">Back to list</Link>
                        </Button>
                    </div>
                </div>

                <div className="rounded-xl border border-sidebar-border/70 bg-background p-6">
                    <AssignmentForm
                        data={form.data}
                        errors={form.errors}
                        processing={form.processing}
                        submitLabel="Publish assignment"
                        assignmentOptions={assignmentOptions}
                        activeAcademicYear={activeAcademicYear}
                        setData={form.setData}
                        onSubmit={(event) => {
                            event.preventDefault();
                            form.post('/teacher/assignments');
                        }}
                    />
                </div>
            </div>
        </AppLayout>
    );
}
