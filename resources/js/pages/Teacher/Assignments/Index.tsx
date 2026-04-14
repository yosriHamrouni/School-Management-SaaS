import { Head, Link, router, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import FlashAlerts from '@/components/ui/flash-alerts';
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

type AssignmentRow = {
    id: number;
    title: string;
    class_name: string | null;
    subject_name: string | null;
    academic_year_name: string | null;
    description: string | null;
    due_date: string | null;
    is_overdue: boolean;
};

type AssignmentOption = {
    class_id: number;
    subject_id: number;
    label: string;
};

type Props = {
    filters: {
        search: string;
        class_id: string;
        subject_id: string;
    };
    assignments: PaginationData<AssignmentRow>;
    assignmentOptions: AssignmentOption[];
    flash?: {
        success?: string | null;
        error?: string | null;
    };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Assignments', href: '/teacher/assignments' },
];

const selectClassName =
    'border-input focus-visible:border-ring focus-visible:ring-ring/50 h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus-visible:ring-[3px]';

export default function TeacherAssignmentsIndex({
    filters,
    assignments,
    assignmentOptions,
}: Props) {
    const { flash } = usePage<Props>().props;
    const [form, setForm] = useState(filters);

    const classOptions = useMemo(() => {
        const seen = new Map<number, string>();

        assignmentOptions.forEach((assignment) => {
            if (! seen.has(assignment.class_id)) {
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

            if (! seen.has(assignment.subject_id)) {
                seen.set(assignment.subject_id, subjectName);
            }
        });

        return Array.from(seen.entries()).map(([id, name]) => ({ id, name }));
    }, [assignmentOptions, form.class_id]);

    const submitSearch = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        router.get('/teacher/assignments', form, {
            preserveState: true,
            replace: true,
        });
    };

    const handleDelete = (id: number) => {
        if (! window.confirm('Delete this assignment?')) {
            return;
        }

        router.delete(`/teacher/assignments/${id}`, {
            preserveScroll: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Assignments" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div className="flex flex-col gap-4 rounded-xl border border-sidebar-border/70 bg-background p-6 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">Assignments</h1>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Publish and manage assignments for the classes and subjects you teach.
                        </p>
                    </div>

                    <Button asChild>
                        <Link href="/teacher/assignments/create">Create assignment</Link>
                    </Button>
                </div>

                <FlashAlerts flash={flash} />

                <div className="rounded-xl border border-sidebar-border/70 bg-background p-4">
                    <form onSubmit={submitSearch} className="grid gap-4 xl:grid-cols-4">
                        <Input
                            value={form.search}
                            onChange={(event) =>
                                setForm((current) => ({ ...current, search: event.target.value }))
                            }
                            placeholder="Search title, class or subject"
                        />

                        <select
                            value={form.class_id}
                            onChange={(event) =>
                                setForm((current) => ({
                                    ...current,
                                    class_id: event.target.value,
                                    subject_id: '',
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
                                setForm((current) => ({ ...current, subject_id: event.target.value }))
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

                        <div className="flex gap-2">
                            <Button type="submit">Apply filters</Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    const reset = {
                                        search: '',
                                        class_id: '',
                                        subject_id: '',
                                    };

                                    setForm(reset);
                                    router.get('/teacher/assignments', reset, {
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
                                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Title</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Class</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Subject</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Academic year</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Due date</th>
                                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {assignments.data.length > 0 ? (
                                    assignments.data.map((assignment) => (
                                        <tr key={assignment.id} className="hover:bg-muted/30">
                                            <td className="px-4 py-3 text-sm">
                                                <div className="font-medium">{assignment.title}</div>
                                                {assignment.description ? (
                                                    <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                                                        {assignment.description}
                                                    </div>
                                                ) : null}
                                            </td>
                                            <td className="px-4 py-3 text-sm">{assignment.class_name ?? '-'}</td>
                                            <td className="px-4 py-3 text-sm">{assignment.subject_name ?? '-'}</td>
                                            <td className="px-4 py-3 text-sm">{assignment.academic_year_name ?? '-'}</td>
                                            <td className="px-4 py-3 text-sm">
                                                <span className={assignment.is_overdue ? 'text-red-600' : ''}>
                                                    {assignment.due_date ?? '-'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="outline" size="sm" asChild>
                                                        <Link href={`/teacher/assignment-submissions?assignment_id=${assignment.id}`}>
                                                            Submissions
                                                        </Link>
                                                    </Button>
                                                    <Button variant="outline" size="sm" asChild>
                                                        <Link href={`/teacher/assignments/${assignment.id}/edit`}>
                                                            Edit
                                                        </Link>
                                                    </Button>
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() => handleDelete(assignment.id)}
                                                    >
                                                        Delete
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-6 text-center text-sm text-muted-foreground">
                                            No assignments have been published yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    {assignments.links.map((link, index) => (
                        <Button
                            key={`${link.label}-${index}`}
                            variant={link.active ? 'default' : 'outline'}
                            size="sm"
                            disabled={! link.url}
                            asChild={Boolean(link.url)}
                        >
                            {link.url ? (
                                <Link
                                    href={link.url}
                                    preserveScroll
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
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
