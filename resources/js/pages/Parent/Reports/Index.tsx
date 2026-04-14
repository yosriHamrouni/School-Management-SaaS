import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type ChildOption = {
    id: number;
    name: string | null;
    student_number: string | null;
    class_name: string | null;
};

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
        evaluation_date: string | null;
        coefficient: number;
        max_grade: number;
        grade: number;
        remarks: string | null;
    }>;
};

type Props = {
    children: ChildOption[];
    selectedChildId: number | null;
    terms: TermOption[];
    selectedTermId: number | null;
    report: {
        student: {
            id: number;
            name: string | null;
            student_number: string | null;
            class_name: string | null;
        };
        general_average: number | null;
        subjects: SubjectReport[];
        term: {
            id: number;
            name: string;
        };
    } | null;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Parent Area', href: '/dashboard' },
    { title: 'Child Grades', href: '#' },
];

const selectClassName =
    'border-input focus-visible:border-ring focus-visible:ring-ring/50 h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus-visible:ring-[3px]';

export default function ParentReportsIndex({
    children,
    selectedChildId,
    terms,
    selectedTermId,
    report,
}: Props) {
    const handleChildChange = (childId: string) => {
        if (!childId) {
            router.get('/parent/reports', {}, { preserveScroll: true });
            return;
        }

        router.get(
            `/parent/reports/${childId}`,
            selectedTermId ? { term_id: selectedTermId } : {},
            { preserveScroll: true },
        );
    };

    const handleTermChange = (termId: string) => {
        if (!selectedChildId) {
            return;
        }

        router.get(
            `/parent/reports/${selectedChildId}`,
            termId ? { term_id: termId } : {},
            { preserveState: true, preserveScroll: true },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Child Grades" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div className="rounded-xl border border-sidebar-border/70 bg-background p-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h1 className="text-2xl font-semibold">Child Grades</h1>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Review grades and term averages only for children linked to your account.
                            </p>
                        </div>

                        <div className="flex flex-col gap-2 sm:flex-row">
                            <select
                                value={selectedChildId ?? ''}
                                onChange={(event) => handleChildChange(event.target.value)}
                                className={selectClassName}
                            >
                                <option value="">Select a child</option>
                                {children.map((child) => (
                                    <option key={child.id} value={String(child.id)}>
                                        {child.name} {child.student_number ? `- ${child.student_number}` : ''}
                                    </option>
                                ))}
                            </select>

                            <select
                                value={selectedTermId ?? ''}
                                onChange={(event) => handleTermChange(event.target.value)}
                                className={selectClassName}
                                disabled={!selectedChildId || terms.length === 0}
                            >
                                {terms.map((term) => (
                                    <option key={term.id} value={String(term.id)}>
                                        {term.name}
                                    </option>
                                ))}
                            </select>

                            {report ? (
                                <Button variant="outline" onClick={() => window.print()}>
                                    Print bulletin
                                </Button>
                            ) : null}
                        </div>
                    </div>
                </div>

                {children.length === 0 ? (
                    <div className="rounded-xl border border-sidebar-border/70 bg-background px-6 py-8 text-sm text-muted-foreground">
                        No child is linked to your parent account yet.
                    </div>
                ) : null}

                {report ? (
                    <>
                        <div className="rounded-xl border border-sidebar-border/70 bg-background p-6">
                            <div className="flex flex-col gap-1">
                                <h2 className="text-lg font-semibold">{report.student.name ?? 'Student'}</h2>
                                <p className="text-sm text-muted-foreground">
                                    {report.student.class_name ?? 'No class'} · {report.student.student_number ?? '-'}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {report.term.name} · General average: {report.general_average ?? '-'}
                                </p>
                            </div>
                        </div>

                        {report.subjects.map((subject) => (
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
                                                    <td className="px-4 py-3 text-sm">{evaluation.evaluation_date ?? '-'}</td>
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
                        ))}
                    </>
                ) : children.length > 0 ? (
                    <div className="rounded-xl border border-sidebar-border/70 bg-background px-6 py-8 text-sm text-muted-foreground">
                        No grade data is available for the selected child yet.
                    </div>
                ) : null}

                <div className="flex justify-end">
                    <Link href="/parent/schedules" className="text-sm text-primary underline-offset-4 hover:underline">
                        Open child schedule
                    </Link>
                </div>
            </div>
        </AppLayout>
    );
}
