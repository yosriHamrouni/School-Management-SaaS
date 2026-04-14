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
    assignment: AssignmentFormData & {
        id: number;
    };
    assignmentOptions: AssignmentOption[];
    activeAcademicYear?: {
        id: number;
        name: string;
    } | null;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Assignments', href: '/teacher/assignments' },
    { title: 'Edit', href: '#' },
];

export default function TeacherAssignmentsEdit({
    assignment,
    assignmentOptions,
    activeAcademicYear,
}: Props) {
    const form = useForm<AssignmentFormData>({
        class_id: String(assignment.class_id),
        subject_id: String(assignment.subject_id),
        title: assignment.title,
        description: assignment.description ?? '',
        due_date: assignment.due_date,
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Assignment" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div className="rounded-xl border border-sidebar-border/70 bg-background p-6">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-semibold">Edit Assignment</h1>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Update the assignment details and due date for your class.
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
                        submitLabel="Save changes"
                        assignmentOptions={assignmentOptions}
                        activeAcademicYear={activeAcademicYear}
                        setData={form.setData}
                        onSubmit={(event) => {
                            event.preventDefault();
                            form.put(`/teacher/assignments/${assignment.id}`);
                        }}
                    />
                </div>
            </div>
        </AppLayout>
    );
}
