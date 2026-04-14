import { FormEvent, useMemo, useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import FlashAlerts from '@/components/ui/flash-alerts';
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

type Evaluation = {
    id: number;
    title: string;
    class_name: string | null;
    subject_name: string | null;
    term_name: string | null;
    type: string;
    coefficient: number;
    max_grade: number;
    evaluation_date: string | null;
};

type Props = {
    filters: {
        search: string;
        class_id: string;
        subject_id: string;
        term_id: string;
        type: string;
    };
    evaluations: PaginationData<Evaluation>;
    assignments: Assignment[];
    terms: TermOption[];
    flash?: {
        success?: string | null;
        error?: string | null;
    };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Evaluations', href: '/evaluations' },
];

const selectClassName =
    'border-input focus-visible:border-ring focus-visible:ring-ring/50 h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus-visible:ring-[3px]';

export default function EvaluationsIndex({
    filters,
    evaluations,
    assignments,
    terms,
}: Props) {
    const { flash } = usePage<Props>().props;
    const [form, setForm] = useState(filters);

    const classOptions = useMemo(() => {
        const seen = new Map<number, string>();

        assignments.forEach((assignment) => {
            if (!seen.has(assignment.class_id)) {
                seen.set(assignment.class_id, assignment.label.split(' - ')[0] ?? assignment.label);
            }
        });

        return Array.from(seen.entries()).map(([id, name]) => ({ id, name }));
    }, [assignments]);

    const subjectOptions = useMemo(() => {
        const filtered = form.class_id
            ? assignments.filter((assignment) => String(assignment.class_id) === form.class_id)
            : assignments;

        const seen = new Map<number, string>();

        filtered.forEach((assignment) => {
            const subjectName = assignment.label.split(' - ')[1]?.split(' (')[0] ?? assignment.label;

            if (!seen.has(assignment.subject_id)) {
                seen.set(assignment.subject_id, subjectName);
            }
        });

        return Array.from(seen.entries()).map(([id, name]) => ({ id, name }));
    }, [assignments, form.class_id]);

    const submitSearch = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        router.get('/evaluations', form, {
            preserveState: true,
            replace: true,
        });
    };

    const handleDelete = (id: number) => {
        if (!window.confirm('Delete this evaluation?')) {
            return;
        }

        router.delete(`/evaluations/${id}`, {
            preserveScroll: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Evaluations" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div className="flex flex-col gap-4 rounded-xl border border-sidebar-border/70 bg-background p-6 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">Evaluations</h1>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Manage assessments and launch grade entry by class and subject.
                        </p>
                    </div>

                    <Button asChild>
                        <Link href="/evaluations/create">Add evaluation</Link>
                    </Button>
                </div>

                <FlashAlerts flash={flash} />

                <div className="rounded-xl border border-sidebar-border/70 bg-background p-4">
                    <form onSubmit={submitSearch} className="grid gap-4 xl:grid-cols-5">
                        <Input
                            value={form.search}
                            onChange={(event) =>
                                setForm((current) => ({ ...current, search: event.target.value }))
                            }
                            placeholder="Search title or type"
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

                        <select
                            value={form.term_id}
                            onChange={(event) =>
                                setForm((current) => ({ ...current, term_id: event.target.value }))
                            }
                            className={selectClassName}
                        >
                            <option value="">All terms</option>
                            {terms.map((term) => (
                                <option key={term.id} value={String(term.id)}>
                                    {term.name}
                                </option>
                            ))}
                        </select>

                        <Input
                            value={form.type}
                            onChange={(event) =>
                                setForm((current) => ({ ...current, type: event.target.value }))
                            }
                            placeholder="Type"
                        />

                        <div className="flex gap-2 xl:col-span-5">
                            <Button type="submit">Apply filters</Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    const reset = {
                                        search: '',
                                        class_id: '',
                                        subject_id: '',
                                        term_id: '',
                                        type: '',
                                    };

                                    setForm(reset);
                                    router.get('/evaluations', reset, {
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
                                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Term</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Date</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Type</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Coeff.</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Max</th>
                                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {evaluations.data.length > 0 ? (
                                    evaluations.data.map((evaluation) => (
                                        <tr key={evaluation.id} className="hover:bg-muted/30">
                                            <td className="px-4 py-3 text-sm">{evaluation.title}</td>
                                            <td className="px-4 py-3 text-sm">{evaluation.class_name ?? '-'}</td>
                                            <td className="px-4 py-3 text-sm">{evaluation.subject_name ?? '-'}</td>
                                            <td className="px-4 py-3 text-sm">{evaluation.term_name ?? '-'}</td>
                                            <td className="px-4 py-3 text-sm">{evaluation.evaluation_date ?? '-'}</td>
                                            <td className="px-4 py-3 text-sm">{evaluation.type}</td>
                                            <td className="px-4 py-3 text-sm">{evaluation.coefficient}</td>
                                            <td className="px-4 py-3 text-sm">{evaluation.max_grade}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="outline" size="sm" asChild>
                                                        <Link href={`/evaluations/${evaluation.id}/grades`}>
                                                            Grades
                                                        </Link>
                                                    </Button>
                                                    <Button variant="outline" size="sm" asChild>
                                                        <Link href={`/evaluations/${evaluation.id}/edit`}>
                                                            Edit
                                                        </Link>
                                                    </Button>
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() => handleDelete(evaluation.id)}
                                                    >
                                                        Delete
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={9} className="px-4 py-6 text-center text-sm text-muted-foreground">
                                            No evaluations found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    {evaluations.links.map((link, index) => (
                        <Button
                            key={`${link.label}-${index}`}
                            variant={link.active ? 'default' : 'outline'}
                            size="sm"
                            disabled={!link.url}
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
