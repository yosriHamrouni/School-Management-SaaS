import { Head, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type TermOption = {
    id: number;
    name: string;
};

type SubjectReport = {
    subject_id: number;
    subject_name: string;
    average: number | null;
    evaluations: Array<{
        id: number;
        title: string;
        type: string;
        evaluation_date: string;
        coefficient: number;
        max_grade: number;
        grade: number;
        remarks: string | null;
    }>;
};

type Props = {
    student: {
        id: number;
        name: string | null;
        student_number: string | null;
        class_name: string | null;
    };
    terms: TermOption[];
    selectedTermId: number | null;
    report: {
        general_average: number | null;
        subjects: SubjectReport[];
        term: {
            id: number;
            name: string;
        };
    } | null;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Reports', href: '#' },
    { title: 'Student report', href: '#' },
];

const selectClassName =
    'border-input focus-visible:border-ring focus-visible:ring-ring/50 h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus-visible:ring-[3px]';

export default function StudentReport({ student, terms, selectedTermId, report }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Student Report" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div className="rounded-xl border border-sidebar-border/70 bg-background p-6">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h1 className="text-2xl font-semibold">Student Report</h1>
                            <p className="mt-2 text-sm text-muted-foreground">
                                {student.name} · {student.class_name ?? 'No class'} · {student.student_number ?? '-'}
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            <select
                                value={selectedTermId ?? ''}
                                onChange={(event) =>
                                    router.get(
                                        `/reports/student/${student.id}`,
                                        { term_id: event.target.value },
                                        { preserveState: true, preserveScroll: true },
                                    )
                                }
                                className={selectClassName}
                            >
                                {terms.map((term) => (
                                    <option key={term.id} value={String(term.id)}>
                                        {term.name}
                                    </option>
                                ))}
                            </select>
                            <Button variant="outline" onClick={() => window.print()}>
                                Print bulletin
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="rounded-xl border border-sidebar-border/70 bg-background p-6">
                    <div className="flex flex-col gap-1">
                        <h2 className="text-lg font-semibold">
                            {report?.term.name ?? 'No term selected'}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            General average: {report?.general_average ?? '-'}
                        </p>
                    </div>
                </div>

                {report ? (
                    report.subjects.map((subject) => (
                        <div
                            key={subject.subject_id}
                            className="overflow-hidden rounded-xl border border-sidebar-border/70 bg-background"
                        >
                            <div className="border-b border-border px-6 py-4">
                                <h3 className="text-lg font-semibold">{subject.subject_name}</h3>
                                <p className="text-sm text-muted-foreground">
                                    Subject average: {subject.average ?? '-'}
                                </p>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-border">
                                    <thead className="bg-muted/50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Evaluation</th>
                                            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Type</th>
                                            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Date</th>
                                            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Coeff.</th>
                                            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Grade</th>
                                            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Max</th>
                                            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Remarks</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {subject.evaluations.map((evaluation) => (
                                            <tr key={evaluation.id}>
                                                <td className="px-4 py-3 text-sm">{evaluation.title}</td>
                                                <td className="px-4 py-3 text-sm">{evaluation.type}</td>
                                                <td className="px-4 py-3 text-sm">{evaluation.evaluation_date}</td>
                                                <td className="px-4 py-3 text-sm">{evaluation.coefficient}</td>
                                                <td className="px-4 py-3 text-sm">{evaluation.grade}</td>
                                                <td className="px-4 py-3 text-sm">{evaluation.max_grade}</td>
                                                <td className="px-4 py-3 text-sm">{evaluation.remarks ?? '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="rounded-xl border border-sidebar-border/70 bg-background px-6 py-8 text-sm text-muted-foreground">
                        No report data available yet.
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
