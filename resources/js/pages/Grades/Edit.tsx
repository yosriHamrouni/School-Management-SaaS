import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import FlashAlerts from '@/components/ui/flash-alerts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type StudentRow = {
    id: number;
    name: string;
    student_number: string | null;
    grade: number | null;
    remarks: string | null;
    subject_average: number | null;
    general_average: number | null;
};

type Props = {
    evaluation: {
        id: number;
        title: string;
        class_name: string | null;
        subject_name: string | null;
        term_id: number | null;
        term_name: string | null;
        type: string;
        coefficient: number;
        max_grade: number;
        evaluation_date: string | null;
    };
    students: StudentRow[];
    flash?: {
        success?: string | null;
        error?: string | null;
    };
};

type GradeFormRow = {
    student_id: number;
    grade: string;
    remarks: string;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Evaluations', href: '/evaluations' },
    { title: 'Grades', href: '#' },
];

export default function GradesEdit({ evaluation, students }: Props) {
    const { flash } = usePage<Props>().props;
    const form = useForm<{ grades: GradeFormRow[] }>({
        grades: students.map((student) => ({
            student_id: student.id,
            grade: student.grade !== null ? String(student.grade) : '',
            remarks: student.remarks ?? '',
        })),
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Grades - ${evaluation.title}`} />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div className="rounded-xl border border-sidebar-border/70 bg-background p-6">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h1 className="text-2xl font-semibold">Grade Entry</h1>
                            <p className="mt-2 text-sm text-muted-foreground">
                                {evaluation.title} · {evaluation.subject_name} · {evaluation.class_name}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Term: {evaluation.term_name ?? '-'} | Date: {evaluation.evaluation_date ?? '-'} | Max grade: {evaluation.max_grade}
                            </p>
                        </div>
                        <Button variant="outline" asChild>
                            <Link href="/evaluations">Back</Link>
                        </Button>
                    </div>
                </div>

                <FlashAlerts flash={flash} />

                <div className="overflow-hidden rounded-xl border border-sidebar-border/70 bg-background">
                    <form
                        onSubmit={(event) => {
                            event.preventDefault();
                            form.post(`/evaluations/${evaluation.id}/grades`);
                        }}
                    >
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-border">
                                <thead className="bg-muted/50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Student</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Student #</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Grade</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Remarks</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Subject avg.</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">General avg.</th>
                                        <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Report</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {students.map((student, index) => (
                                        <tr key={student.id} className="hover:bg-muted/30">
                                            <td className="px-4 py-3 text-sm">{student.name}</td>
                                            <td className="px-4 py-3 text-sm">{student.student_number ?? '-'}</td>
                                            <td className="px-4 py-3">
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={form.data.grades[index]?.grade ?? ''}
                                                    onChange={(event) => {
                                                        const grades = [...form.data.grades];
                                                        grades[index] = {
                                                            ...grades[index],
                                                            grade: event.target.value,
                                                        };
                                                        form.setData('grades', grades);
                                                    }}
                                                />
                                                <div className="mt-1 text-xs text-red-600">
                                                    {form.errors[`grades.${index}.grade` as keyof typeof form.errors]}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <Input
                                                    value={form.data.grades[index]?.remarks ?? ''}
                                                    onChange={(event) => {
                                                        const grades = [...form.data.grades];
                                                        grades[index] = {
                                                            ...grades[index],
                                                            remarks: event.target.value,
                                                        };
                                                        form.setData('grades', grades);
                                                    }}
                                                    placeholder="Optional"
                                                />
                                            </td>
                                            <td className="px-4 py-3 text-sm">{student.subject_average ?? '-'}</td>
                                            <td className="px-4 py-3 text-sm">{student.general_average ?? '-'}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex justify-end">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        type="button"
                                                        onClick={() =>
                                                            router.visit(`/reports/student/${student.id}?term_id=${evaluation.term_id ?? ''}`)
                                                        }
                                                    >
                                                        View
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex justify-end border-t border-border px-4 py-4">
                            <Button type="submit" disabled={form.processing}>
                                Save grades
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
