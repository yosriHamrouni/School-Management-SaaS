import { FormEvent, useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type Subject = {
    id: number;
    establishment_id: number;
    name: string;
};

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type PaginationData = {
    data: Subject[];
    links: PaginationLink[];
};

type PageProps = {
    filters: {
        search: string;
    };
    subjects: PaginationData;
    flash?: {
        success?: string | null;
        error?: string | null;
    };
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Subjects',
        href: '/establishment-admin/subjects',
    },
];

export default function SubjectsIndex({ filters, subjects }: PageProps) {
    const { flash } = usePage<PageProps>().props;
    const [search, setSearch] = useState(filters.search ?? '');

    const submitSearch = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        router.get(
            '/establishment-admin/subjects',
            { search },
            { preserveState: true, replace: true },
        );
    };

    const handleDelete = (id: number) => {
        if (!window.confirm('Delete this subject?')) {
            return;
        }

        router.delete(`/establishment-admin/subjects/${id}`, {
            preserveScroll: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Subjects" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div className="flex flex-col gap-4 rounded-xl border border-sidebar-border/70 bg-background p-6 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">Subjects</h1>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Manage subjects for your establishment.
                        </p>
                    </div>

                    <Button asChild>
                        <Link href="/establishment-admin/subjects/create">
                            Add subject
                        </Link>
                    </Button>
                </div>

                {flash?.success ? (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                        {flash.success}
                    </div>
                ) : null}

                {flash?.error ? (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {flash.error}
                    </div>
                ) : null}

                <div className="rounded-xl border border-sidebar-border/70 bg-background p-4">
                    <form
                        onSubmit={submitSearch}
                        className="flex flex-col gap-3 md:flex-row"
                    >
                        <Input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search by name"
                            className="w-full"
                        />
                        <div className="flex gap-2">
                            <Button type="submit">Search</Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setSearch('');
                                    router.get(
                                        '/establishment-admin/subjects',
                                        {},
                                        { preserveState: true, replace: true },
                                    );
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
                                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                                        Name
                                    </th>
                                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {subjects.data.length > 0 ? (
                                    subjects.data.map((subject) => (
                                        <tr
                                            key={subject.id}
                                            className="hover:bg-muted/30"
                                        >
                                            <td className="px-4 py-3 text-sm">
                                                {subject.name}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        asChild
                                                    >
                                                        <Link
                                                            href={`/establishment-admin/subjects/${subject.id}`}
                                                        >
                                                            View
                                                        </Link>
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        asChild
                                                    >
                                                        <Link
                                                            href={`/establishment-admin/subjects/${subject.id}/edit`}
                                                        >
                                                            Edit
                                                        </Link>
                                                    </Button>
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() =>
                                                            handleDelete(
                                                                subject.id,
                                                            )
                                                        }
                                                    >
                                                        Delete
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={2}
                                            className="px-4 py-6 text-center text-sm text-muted-foreground"
                                        >
                                            No subjects found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    {subjects.links.map((link, index) => (
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
                                    dangerouslySetInnerHTML={{
                                        __html: link.label,
                                    }}
                                />
                            ) : (
                                <span
                                    dangerouslySetInnerHTML={{
                                        __html: link.label,
                                    }}
                                />
                            )}
                        </Button>
                    ))}
                </div>
            </div>
        </AppLayout>
    );
}
