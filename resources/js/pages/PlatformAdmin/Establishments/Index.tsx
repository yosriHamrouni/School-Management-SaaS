import { FormEvent, useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type EstablishmentRow = {
    id: number;
    name: string;
    code: string;
    type: string;
    city: string | null;
    phone: string | null;
    email: string | null;
    director_name: string | null;
    is_active: boolean;
    created_at: string | null;
};

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type EstablishmentsPagination = {
    data: EstablishmentRow[];
    links: PaginationLink[];
};

type PageProps = {
    filters: {
        search: string;
    };
    establishments: EstablishmentsPagination;
    flash?: {
        success?: string | null;
        error?: string | null;
    };
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Platform Admin',
        href: '/platform-admin',
    },
    {
        title: 'Establishments',
        href: '/platform-admin/establishments',
    },
];

export default function EstablishmentsIndex({
    filters,
    establishments,
}: PageProps) {
    const { flash } = usePage<PageProps>().props;
    const [search, setSearch] = useState(filters.search ?? '');

    const submitSearch = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        router.get(
            '/platform-admin/establishments',
            { search },
            { preserveState: true, replace: true },
        );
    };

    const handleDelete = (id: number) => {
        if (!window.confirm('Delete this establishment?')) {
            return;
        }

        router.delete(`/platform-admin/establishments/${id}`, {
            preserveScroll: true,
        });
    };

    const handleToggleStatus = (id: number) => {
        router.patch(
            `/platform-admin/establishments/${id}/toggle-status`,
            {},
            { preserveScroll: true },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Establishments" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div className="flex flex-col gap-4 rounded-xl border border-sidebar-border/70 bg-background p-6 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">Establishments</h1>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Manage the establishments accessible to the platform.
                        </p>
                    </div>

                    <Button asChild>
                        <Link href="/platform-admin/establishments/create">
                            Add establishment
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
                            placeholder="Search by name or code"
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
                                        '/platform-admin/establishments',
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
                                        Code
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                                        Type
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                                        City
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                                        Status
                                    </th>
                                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {establishments.data.length > 0 ? (
                                    establishments.data.map((establishment) => (
                                        <tr
                                            key={establishment.id}
                                            className="hover:bg-muted/30"
                                        >
                                            <td className="px-4 py-3 text-sm">
                                                {establishment.name}
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                {establishment.code}
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                {establishment.type}
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                {establishment.city ?? '-'}
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                <span
                                                    className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                                                        establishment.is_active
                                                            ? 'bg-emerald-100 text-emerald-700'
                                                            : 'bg-slate-200 text-slate-700'
                                                    }`}
                                                >
                                                    {establishment.is_active
                                                        ? 'Active'
                                                        : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        asChild
                                                    >
                                                        <Link
                                                            href={`/platform-admin/establishments/${establishment.id}`}
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
                                                            href={`/platform-admin/establishments/${establishment.id}/edit`}
                                                        >
                                                            Edit
                                                        </Link>
                                                    </Button>
                                                    <Button
                                                        variant="secondary"
                                                        size="sm"
                                                        onClick={() =>
                                                            handleToggleStatus(
                                                                establishment.id,
                                                            )
                                                        }
                                                    >
                                                        {establishment.is_active
                                                            ? 'Disable'
                                                            : 'Activate'}
                                                    </Button>
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() =>
                                                            handleDelete(
                                                                establishment.id,
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
                                            No establishments found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    {establishments.links.map((link, index) => (
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
