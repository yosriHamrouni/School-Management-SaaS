import { Head, Link, usePage, router } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { useState } from 'react';
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
    description: string | null;
    subject_name: string | null;
    class_name: string | null;
    academic_year_name: string | null;
    due_date: string | null;
    is_overdue: boolean;
    submission: {
        id: number;
        attachment_original_name: string;
        submitted_at: string | null;
        is_late: boolean;
    } | null;
};

type Props = {
    filters: {
        search: string;
        status: string;
    };
    assignments: PaginationData<AssignmentRow>;
    className: string | null;
    flash?: {
        success?: string | null;
        error?: string | null;
    };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Assignments', href: '/student/assignments' },
];

const selectClassName =
    'border-input focus-visible:border-ring focus-visible:ring-ring/50 h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus-visible:ring-[3px]';

export default function StudentAssignmentsIndex({ filters, assignments, className }: Props) {
    const { flash } = usePage<Props>().props;
    const [form, setForm] = useState(filters);

    const submitSearch = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        router.get('/student/assignments', form, {
            preserveState: true,
            replace: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Assignments" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div className="rounded-xl border border-sidebar-border/70 bg-background p-6">
                    <h1 className="text-2xl font-semibold">Assignments</h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                        {className
                            ? `Track and submit homework published for ${className}.`
                            : 'No class is currently assigned to your student profile.'}
                    </p>
                </div>

                <FlashAlerts flash={flash} />

                <div className="rounded-xl border border-sidebar-border/70 bg-background p-4">
                    <form onSubmit={submitSearch} className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px_auto]">
                        <Input
                            value={form.search}
                            onChange={(event) => setForm((current) => ({ ...current, search: event.target.value }))}
                            placeholder="Search title or subject"
                        />

                        <select
                            value={form.status}
                            onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}
                            className={selectClassName}
                        >
                            <option value="">All statuses</option>
                            <option value="pending">Pending</option>
                            <option value="submitted">Submitted</option>
                        </select>

                        <div className="flex gap-2">
                            <Button type="submit">Apply filters</Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    const reset = { search: '', status: '' };

                                    setForm(reset);
                                    router.get('/student/assignments', reset, {
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
                                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Subject</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Due date</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {assignments.data.length > 0 ? (
                                    assignments.data.map((assignment) => (
                                        <tr key={assignment.id} className="hover:bg-muted/30">
                                            <td className="px-4 py-3 text-sm">
                                                <div className="font-medium">{assignment.title}</div>
                                                <div className="mt-1 text-xs text-muted-foreground">
                                                    {[assignment.class_name, assignment.academic_year_name].filter(Boolean).join(' / ')}
                                                </div>
                                                {assignment.description ? (
                                                    <div className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                                                        {assignment.description}
                                                    </div>
                                                ) : null}
                                            </td>
                                            <td className="px-4 py-3 text-sm">{assignment.subject_name ?? '-'}</td>
                                            <td className="px-4 py-3 text-sm">
                                                <span className={assignment.is_overdue && !assignment.submission ? 'text-red-600' : ''}>
                                                    {assignment.due_date ?? '-'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                {assignment.submission ? (
                                                    <div className="space-y-1">
                                                        <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
                                                            Submitted
                                                        </span>
                                                        <div className="text-xs text-muted-foreground">
                                                            {assignment.submission.submitted_at ?? '-'}
                                                        </div>
                                                        {assignment.submission.is_late ? (
                                                            <div className="text-xs text-amber-600">Submitted after the due date</div>
                                                        ) : null}
                                                    </div>
                                                ) : (
                                                    <div className="space-y-1">
                                                        <span className="inline-flex rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                                                            {assignment.is_overdue ? 'Late' : 'Pending'}
                                                        </span>
                                                        {assignment.is_overdue ? (
                                                            <div className="text-xs text-red-600">Due date passed</div>
                                                        ) : null}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <Button variant="outline" size="sm" asChild>
                                                    <Link href={`/student/assignments/${assignment.id}`}>
                                                        {assignment.submission ? 'Update submission' : 'Open'}
                                                    </Link>
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-6 text-center text-sm text-muted-foreground">
                                            No assignments are available for your class yet.
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
