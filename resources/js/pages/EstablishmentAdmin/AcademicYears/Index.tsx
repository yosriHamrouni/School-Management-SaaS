import { FormEvent, useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type AcademicYearRow = {
    id: number;
    name: string;
    start_date: string;
    end_date: string;
    status: string;
    is_current: boolean;
};

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type AcademicYearsPagination = {
    data: AcademicYearRow[];
    links: PaginationLink[];
};

type PageProps = {
    filters: {
        search: string;
    };
    academicYears: AcademicYearsPagination;
    flash?: {
        success?: string | null;
        error?: string | null;
    };
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Academic Years',
        href: '/establishment-admin/academic-years',
    },
];

export default function AcademicYearsIndex({
    filters,
    academicYears,
}: PageProps) {
    const { flash } = usePage<PageProps>().props;
    const [search, setSearch] = useState(filters.search ?? '');

    const submitSearch = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        router.get(
            '/establishment-admin/academic-years',
            { search },
            { preserveState: true, replace: true },
        );
    };

    const handleDelete = (id: number) => {
        if (!window.confirm('Delete this academic year?')) {
            return;
        }

        router.delete(`/establishment-admin/academic-years/${id}`, {
            preserveScroll: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Academic Years" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div className="flex flex-col gap-4 rounded-xl border border-sidebar-border/70 bg-background p-6 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">Academic Years</h1>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Manage the academic years for your establishment.
                        </p>
                    </div>

                    <Button asChild>
                        <Link href="/establishment-admin/academic-years/create">
                            Add academic year
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
                                        '/establishment-admin/academic-years',
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
                                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                                        Start Date
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                                        End Date
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                                        Status
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                                        Current
                                    </th>
                                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {academicYears.data.length > 0 ? (
                                    academicYears.data.map((academicYear) => (
                                        <tr
                                            key={academicYear.id}
                                            className="hover:bg-muted/30"
                                        >
                                            <td className="px-4 py-3 text-sm">
                                                {academicYear.name}
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                {academicYear.start_date}
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                {academicYear.end_date}
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                <span
                                                    className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                                                        academicYear.status ===
                                                        'active'
                                                            ? 'bg-emerald-100 text-emerald-700'
                                                            : 'bg-slate-200 text-slate-700'
                                                    }`}
                                                >
                                                    {academicYear.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                {academicYear.is_current ? (
                                                    <span className="inline-flex rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
                                                        Current
                                                    </span>
                                                ) : (
                                                    '-'
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        asChild
                                                    >
                                                        <Link
                                                            href={`/establishment-admin/academic-years/${academicYear.id}`}
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
                                                            href={`/establishment-admin/academic-years/${academicYear.id}/edit`}
                                                        >
                                                            Edit
                                                        </Link>
                                                    </Button>
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() =>
                                                            handleDelete(
                                                                academicYear.id,
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
                                            colSpan={6}
                                            className="px-4 py-6 text-center text-sm text-muted-foreground"
                                        >
                                            No academic years found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    {academicYears.links.map((link, index) => (
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
