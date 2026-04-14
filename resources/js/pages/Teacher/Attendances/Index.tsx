import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
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

type ScheduleRow = {
    id: number;
    class_name: string | null;
    subject_name: string | null;
    day_of_week: string;
    start_time: string;
    end_time: string;
    attendance_count: number;
    last_recorded_at: string | null;
};

type Option = {
    id: number;
    name: string;
};

type Props = {
    filters: {
        search: string;
        class_id: string;
        day_of_week: string;
    };
    schedules: PaginationData<ScheduleRow>;
    classes: Option[];
    dayOptions: string[];
    flash?: {
        success?: string | null;
        error?: string | null;
    };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Attendance', href: '/teacher/attendances' },
];

const selectClassName =
    'border-input focus-visible:border-ring focus-visible:ring-ring/50 h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus-visible:ring-[3px]';

export default function TeacherAttendancesIndex({
    filters,
    schedules,
    classes,
    dayOptions,
}: Props) {
    const { flash } = usePage<Props>().props;
    const [form, setForm] = useState(filters);

    const submitFilters = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        router.get('/teacher/attendances', form, {
            preserveState: true,
            replace: true,
        });
    };

    const resetFilters = () => {
        const nextFilters = {
            search: '',
            class_id: '',
            day_of_week: '',
        };

        setForm(nextFilters);
        router.get('/teacher/attendances', nextFilters, {
            preserveState: true,
            replace: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Attendance Sessions" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div className="flex flex-col gap-4 rounded-xl border border-sidebar-border/70 bg-background p-6 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">Attendance Sessions</h1>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Select one of your sessions and record attendance in bulk for the class.
                        </p>
                    </div>

                    <Button variant="outline" asChild>
                        <Link href="/teacher/attendances/history">Open history</Link>
                    </Button>
                </div>

                <FlashAlerts flash={flash} />

                <div className="rounded-xl border border-sidebar-border/70 bg-background p-4">
                    <form onSubmit={submitFilters} className="grid gap-4 md:grid-cols-4">
                        <Input
                            value={form.search}
                            onChange={(event) =>
                                setForm((current) => ({ ...current, search: event.target.value }))
                            }
                            placeholder="Search by class, subject or day"
                        />

                        <select
                            value={form.class_id}
                            onChange={(event) =>
                                setForm((current) => ({ ...current, class_id: event.target.value }))
                            }
                            className={selectClassName}
                        >
                            <option value="">All classes</option>
                            {classes.map((option) => (
                                <option key={option.id} value={String(option.id)}>
                                    {option.name}
                                </option>
                            ))}
                        </select>

                        <select
                            value={form.day_of_week}
                            onChange={(event) =>
                                setForm((current) => ({ ...current, day_of_week: event.target.value }))
                            }
                            className={selectClassName}
                        >
                            <option value="">All days</option>
                            {dayOptions.map((day) => (
                                <option key={day} value={day}>
                                    {day}
                                </option>
                            ))}
                        </select>

                        <div className="flex gap-2">
                            <Button type="submit">Apply filters</Button>
                            <Button type="button" variant="outline" onClick={resetFilters}>
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
                                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Class</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Subject</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Day</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Time</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Recorded</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Last update</th>
                                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {schedules.data.length > 0 ? (
                                    schedules.data.map((schedule) => (
                                        <tr key={schedule.id} className="hover:bg-muted/30">
                                            <td className="px-4 py-3 text-sm">{schedule.class_name ?? '-'}</td>
                                            <td className="px-4 py-3 text-sm">{schedule.subject_name ?? '-'}</td>
                                            <td className="px-4 py-3 text-sm">{schedule.day_of_week}</td>
                                            <td className="px-4 py-3 text-sm">
                                                {schedule.start_time} - {schedule.end_time}
                                            </td>
                                            <td className="px-4 py-3 text-sm">{schedule.attendance_count}</td>
                                            <td className="px-4 py-3 text-sm">
                                                {schedule.last_recorded_at
                                                    ? new Date(schedule.last_recorded_at).toLocaleString()
                                                    : '-'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex justify-end">
                                                    <Button size="sm" asChild>
                                                        <Link href={`/teacher/attendances/${schedule.id}/edit`}>
                                                            Record attendance
                                                        </Link>
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-6 text-center text-sm text-muted-foreground">
                                            No teaching sessions match the current filters.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    {schedules.links.map((link, index) => (
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
