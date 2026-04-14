import { Head, Link, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type PaginationData<T> = {
    data: T[];
    links: PaginationLink[];
};

type AssignmentOption = {
    class_id: number;
    subject_id: number;
    label: string;
};

type AssignmentFilterOption = {
    id: number;
    class_id: number;
    subject_id: number;
    label: string;
};

type SubmissionRow = {
    assignment_id: number;
    assignment_title: string;
    class_name: string | null;
    subject_name: string | null;
    student_name: string;
    student_number: string | null;
    due_date: string | null;
    status: 'submitted' | 'pending' | 'late';
    submission: {
        id: number;
        submitted_at: string | null;
        attachment_original_name: string;
        download_url: string;
    } | null;
};

type Props = {
    filters: {
        class_id: string;
        subject_id: string;
        assignment_id: string;
        status: string;
        search: string;
    };
    submissions: PaginationData<SubmissionRow>;
    assignmentOptions: AssignmentOption[];
    assignmentFilterOptions: AssignmentFilterOption[];
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Assignments', href: '/teacher/assignments' },
    { title: 'Submissions', href: '/teacher/assignment-submissions' },
];

const selectClassName =
    'border-input focus-visible:border-ring focus-visible:ring-ring/50 h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus-visible:ring-[3px]';

export default function TeacherAssignmentSubmissionsIndex({
    filters,
    submissions,
    assignmentOptions,
    assignmentFilterOptions,
}: Props) {
    const [form, setForm] = useState(filters);

    const classOptions = useMemo(() => {
        const seen = new Map<number, string>();

        assignmentOptions.forEach((assignment) => {
            if (!seen.has(assignment.class_id)) {
                seen.set(assignment.class_id, assignment.label.split(' - ')[0] ?? assignment.label);
            }
        });

        return Array.from(seen.entries()).map(([id, name]) => ({ id, name }));
    }, [assignmentOptions]);

    const subjectOptions = useMemo(() => {
        const filtered = form.class_id
            ? assignmentOptions.filter((assignment) => String(assignment.class_id) === form.class_id)
            : assignmentOptions;

        const seen = new Map<number, string>();

        filtered.forEach((assignment) => {
            const subjectName = assignment.label.split(' - ')[1] ?? assignment.label;

            if (!seen.has(assignment.subject_id)) {
                seen.set(assignment.subject_id, subjectName);
            }
        });

        return Array.from(seen.entries()).map(([id, name]) => ({ id, name }));
    }, [assignmentOptions, form.class_id]);

    const assignmentChoices = useMemo(() => {
        return assignmentFilterOptions.filter((assignment) => {
            if (form.class_id && String(assignment.class_id) !== form.class_id) {
                return false;
            }

            if (form.subject_id && String(assignment.subject_id) !== form.subject_id) {
                return false;
            }

            return true;
        });
    }, [assignmentFilterOptions, form.class_id, form.subject_id]);

    const submitSearch = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        router.get('/teacher/assignment-submissions', form, {
            preserveState: true,
            replace: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Assignment Submissions" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div className="flex flex-col gap-4 rounded-xl border border-sidebar-border/70 bg-background p-6 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">Assignment Submissions</h1>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Review file deposits for the assignments you published, including pending and late submissions.
                        </p>
                    </div>

                    <Button variant="outline" asChild>
                        <Link href="/teacher/assignments">Back to assignments</Link>
                    </Button>
                </div>

                <div className="rounded-xl border border-sidebar-border/70 bg-background p-4">
                    <form onSubmit={submitSearch} className="grid gap-4 xl:grid-cols-5">
                        <Input
                            value={form.search}
                            onChange={(event) =>
                                setForm((current) => ({ ...current, search: event.target.value }))
                            }
                            placeholder="Search assignment or student"
                        />

                        <select
                            value={form.class_id}
                            onChange={(event) =>
                                setForm((current) => ({
                                    ...current,
                                    class_id: event.target.value,
                                    subject_id: '',
                                    assignment_id: '',
                                }))
                            }
                            className={selectClassName}
                        >
                            <option value="">All classes</option>
                            {classOptions.map((option) => (
                                <option key={option.id} value={String(option.id)}>
                                    {option.name}
                                </option>
                            ))}
                        </select>

                        <select
                            value={form.subject_id}
                            onChange={(event) =>
                                setForm((current) => ({
                                    ...current,
                                    subject_id: event.target.value,
                                    assignment_id: '',
                                }))
                            }
                            className={selectClassName}
                        >
                            <option value="">All subjects</option>
                            {subjectOptions.map((option) => (
                                <option key={option.id} value={String(option.id)}>
                                    {option.name}
                                </option>
                            ))}
                        </select>

                        <select
                            value={form.assignment_id}
                            onChange={(event) =>
                                setForm((current) => ({ ...current, assignment_id: event.target.value }))
                            }
                            className={selectClassName}
                        >
                            <option value="">All assignments</option>
                            {assignmentChoices.map((option) => (
                                <option key={option.id} value={String(option.id)}>
                                    {option.label}
                                </option>
                            ))}
                        </select>

                        <select
                            value={form.status}
                            onChange={(event) =>
                                setForm((current) => ({ ...current, status: event.target.value }))
                            }
                            className={selectClassName}
                        >
                            <option value="">All statuses</option>
                            <option value="submitted">Submitted</option>
                            <option value="pending">Pending</option>
                            <option value="late">Late</option>
                        </select>

                        <div className="flex gap-2 xl:col-span-5">
                            <Button type="submit">Apply filters</Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    const reset = {
                                        class_id: '',
                                        subject_id: '',
                                        assignment_id: '',
                                        status: '',
                                        search: '',
                                    };

                                    setForm(reset);
                                    router.get('/teacher/assignment-submissions', reset, {
                                        preserveState: true,
                                        replace: true,
                                    });
                                }}
                            >
                                Reset
                            </Button>
                        </div>
                    </form>
                </div>

                <div className="overflow-hidden rounded-xl border border-sidebar-border/70 bg-background">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-border">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Assignment</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Student</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Due date</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Submitted at</th>
                                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {submissions.data.length > 0 ? (
                                    submissions.data.map((row, index) => (
                                        <tr key={`${row.assignment_id}-${row.student_name}-${index}`} className="hover:bg-muted/30">
                                            <td className="px-4 py-3 text-sm">
                                                <div className="font-medium">{row.assignment_title}</div>
                                                <div className="mt-1 text-xs text-muted-foreground">
                                                    {[row.class_name, row.subject_name].filter(Boolean).join(' / ')}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                <div className="font-medium">{row.student_name}</div>
                                                <div className="mt-1 text-xs text-muted-foreground">
                                                    {row.student_number ?? 'No student number'}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-sm">{row.due_date ?? '-'}</td>
                                            <td className="px-4 py-3 text-sm">
                                                <span
                                                    className={
                                                        row.status === 'late'
                                                            ? 'inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700'
                                                            : row.status === 'submitted'
                                                              ? 'inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700'
                                                              : 'inline-flex rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground'
                                                    }
                                                >
                                                    {row.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm">{row.submission?.submitted_at ?? '-'}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="outline" size="sm" asChild>
                                                        <Link href={`/teacher/assignments?assignment_id=${row.assignment_id}`}>
                                                            Assignment
                                                        </Link>
                                                    </Button>
                                                    {row.submission ? (
                                                        <Button size="sm" asChild>
                                                            <a href={row.submission.download_url}>
                                                                Download
                                                            </a>
                                                        </Button>
                                                    ) : null}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-6 text-center text-sm text-muted-foreground">
                                            No assignment submissions match the selected filters.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    {submissions.links.map((link, index) => (
                        <Button
                            key={`${link.label}-${index}`}
                            variant={link.active ? 'default' : 'outline'}
                            size="sm"
                            disabled={!link.url}
                            asChild={Boolean(link.url)}
                        >
                            {link.url ? (
                                <Link href={link.url} preserveScroll dangerouslySetInnerHTML={{ __html: link.label }} />
                            ) : (
                                <span dangerouslySetInnerHTML={{ __html: link.label }} />
                            )}
                        </Button>
                    ))}
                </div>
            </div>
        </AppLayout>
    );
}
