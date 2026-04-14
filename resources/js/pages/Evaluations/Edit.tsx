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
    evaluation: EvaluationFormData & {
        id: number;
    };
    assignments: Assignment[];
    terms: TermOption[];
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Evaluations', href: '/evaluations' },
    { title: 'Edit', href: '#' },
];

export default function EvaluationsEdit({ evaluation, assignments, terms }: Props) {
    const form = useForm<EvaluationFormData>({
        title: evaluation.title,
        class_id: String(evaluation.class_id),
        subject_id: String(evaluation.subject_id),
        term_id: evaluation.term_id ? String(evaluation.term_id) : '',
        type: evaluation.type,
        coefficient: evaluation.coefficient,
        max_grade: evaluation.max_grade,
        evaluation_date: evaluation.evaluation_date,
        description: evaluation.description ?? '',
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Evaluation" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div className="rounded-xl border border-sidebar-border/70 bg-background p-6">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-semibold">Edit Evaluation</h1>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Update the assessment metadata before continuing with grade entry.
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
                        submitLabel="Save changes"
                        assignments={assignments}
                        terms={terms}
                        setData={form.setData}
                        onSubmit={(event) => {
                            event.preventDefault();
                            form.put(`/evaluations/${evaluation.id}`);
                        }}
                    />
                </div>
            </div>
        </AppLayout>
    );
}
