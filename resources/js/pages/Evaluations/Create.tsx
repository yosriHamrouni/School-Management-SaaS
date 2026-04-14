import { Head, Link, useForm } from '@inertiajs/react';
import EvaluationForm, { type EvaluationFormData } from '@/components/evaluations/evaluation-form';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type Assignment = {
    class_id: number;
    subject_id: number;
    teacher_id: number;
    label: string;
};

type TermOption = {
    id: number;
    name: string;
};

type Props = {
    assignments: Assignment[];
    terms: TermOption[];
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Evaluations', href: '/evaluations' },
    { title: 'Create', href: '/evaluations/create' },
];

export default function EvaluationsCreate({ assignments, terms }: Props) {
    const form = useForm<EvaluationFormData>({
        title: '',
        class_id: '',
        subject_id: '',
        term_id: '',
        type: 'exam',
        coefficient: '1',
        max_grade: '20',
        evaluation_date: '',
        description: '',
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Evaluation" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div className="rounded-xl border border-sidebar-border/70 bg-background p-6">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-semibold">Create Evaluation</h1>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Register a new evaluation for one of your allowed class-subject assignments.
                            </p>
                        </div>
                        <Button variant="outline" asChild>
                            <Link href="/evaluations">Back to list</Link>
                        </Button>
                    </div>
                </div>

                <div className="rounded-xl border border-sidebar-border/70 bg-background p-6">
                    <EvaluationForm
                        data={form.data}
                        errors={form.errors}
                        processing={form.processing}
                        submitLabel="Create evaluation"
                        assignments={assignments}
                        terms={terms}
                        setData={form.setData}
                        onSubmit={(event) => {
                            event.preventDefault();
                            form.post('/evaluations');
                        }}
                    />
                </div>
            </div>
        </AppLayout>
    );
}
