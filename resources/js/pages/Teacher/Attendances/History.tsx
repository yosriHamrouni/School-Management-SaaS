import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { Badge } from '@/components/ui/badge';
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

type AttendanceRow = {
    id: number;
    student_name: string | null;
    class_name: string | null;
    subject_name: string | null;
    session_label: string;
    status: string;
    justification: string | null;
    recorded_at: string | null;
    absence_count: number;
    has_repeated_absences: boolean;
};

type Option = {
    id: number;
    name: string;
};

type Props = {
    filters: {
        class_id: string;
        status: string;
        student: string;
        date_from: string;
        date_to: string;
    };
    attendances: PaginationData<AttendanceRow>;
    summary: {
        total: number;
        present: number;
        absent: number;
        late: number;
    };
    classes: Option[];
    statusOptions: string[];
    repeatedAbsenceThreshold: number;
    flash?: {
        success?: string | null;
        error?: string | null;
    };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Attendance', href: '/teacher/attendances' },
    { title: 'History', href: '/teacher/attendances/history' },
];

const selectClassName =
    'border-input focus-visible:border-ring focus-visible:ring-ring/50 h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus-visible:ring-[3px]';

function statusLabel(status: string) {
    if (status === 'present') {
        return 'Present';
    }

    if (status === 'absent') {
        return 'Absent';
    }

    return 'Late';
}

function statusBadgeVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
    if (status === 'present') {
        return 'default';
    }

    if (status === 'absent') {
        return 'destructive';
    }

    return 'secondary';
}

export default function TeacherAttendancesHistory({
    filters,
    attendances,
    summary,
    classes,
    statusOptions,
    repeatedAbsenceThreshold,
}: Props) {
    const { flash } = usePage<Props>().props;
    const [form, setForm] = useState(filters);

    const submitFilters = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        router.get('/teacher/attendances/history', form, {
            preserveState: true,
            replace: true,
        });
    };

    const resetFilters = () => {
        const nextFilters = {
            class_id: '',
            status: '',
            student: '',
            date_from: '',
            date_to: '',
        };

        setForm(nextFilters);
        router.get('/teacher/attendances/history', nextFilters, {
            preserveState: true,
            replace: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Attendance History" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div className="flex flex-col gap-4 rounded-xl border border-sidebar-border/70 bg-background p-6 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">Attendance History</h1>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Review saved attendance records by class, student, status and date.
                        </p>
                    </div>

                    <Button variant="outline" asChild>
                        <Link href="/teacher/attendances">Back to sessions</Link>
                    </Button>
                </div>

                <FlashAlerts flash={flash} />

                <div className="grid gap-4 md:grid-cols-4">
                    <div className="rounded-xl border border-sidebar-border/70 bg-background p-4">
                        <p className="text-sm text-muted-foreground">Total records</p>
                        <p className="mt-2 text-2xl font-semibold">{summary.total}</p>
                    </div>
                    <div className="rounded-xl border border-sidebar-border/70 bg-background p-4">
                        <p className="text-sm text-muted-foreground">Present</p>
                        <p className="mt-2 text-2xl font-semibold">{summary.present}</p>
                    </div>
                    <div className="rounded-xl border border-sidebar-border/70 bg-background p-4">
                        <p className="text-sm text-muted-foreground">Absent</p>
                        <p className="mt-2 text-2xl font-semibold">{summary.absent}</p>
                    </div>
                    <div className="rounded-xl border border-sidebar-border/70 bg-background p-4">
                        <p className="text-sm text-muted-foreground">Late</p>
                        <p className="mt-2 text-2xl font-semibold">{summary.late}</p>
                    </div>
                </div>

                <div className="rounded-xl border border-sidebar-border/70 bg-background p-4">
                    <form onSubmit={submitFilters} className="grid gap-4 xl:grid-cols-5">
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
                            value={form.status}
                            onChange={(event) =>
                                setForm((current) => ({ ...current, status: event.target.value }))
                            }
                            className={selectClassName}
                        >
                            <option value="">All statuses</option>
                            {statusOptions.map((status) => (
                                <option key={status} value={status}>
                                    {statusLabel(status)}
                                </option>
                            ))}
                        </select>

                        <Input
                            value={form.student}
                            onChange={(event) =>
                                setForm((current) => ({ ...current, student: event.target.value }))
                            }
                            placeholder="Student name"
                        />

                        <Input
                            type="date"
                            value={form.date_from}
                            onChange={(event) =>
                                setForm((current) => ({ ...current, date_from: event.target.value }))
                            }
                        />

                        <Input
                            type="date"
                            value={form.date_to}
                            onChange={(event) =>
                                setForm((current) => ({ ...current, date_to: event.target.value }))
                            }
                        />

                        <div className="flex gap-2 xl:col-span-5">
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
                                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Student</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Class</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Session</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Justification</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Recorded at</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Alert</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {attendances.data.length > 0 ? (
                                    attendances.data.map((attendance) => (
                                        <tr key={attendance.id} className="hover:bg-muted/30">
                                            <td className="px-4 py-3 text-sm font-medium">{attendance.student_name ?? '-'}</td>
                                            <td className="px-4 py-3 text-sm">
                                                <div>{attendance.class_name ?? '-'}</div>
                                                <div className="mt-1 text-xs text-muted-foreground">
                                                    {attendance.subject_name ?? '-'}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-sm">{attendance.session_label}</td>
                                            <td className="px-4 py-3 text-sm">
                                                <Badge variant={statusBadgeVariant(attendance.status)}>
                                                    {statusLabel(attendance.status)}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 text-sm">{attendance.justification ?? '-'}</td>
                                            <td className="px-4 py-3 text-sm">{attendance.recorded_at ?? '-'}</td>
                                            <td className="px-4 py-3 text-sm">
                                                {attendance.has_repeated_absences ? (
                                                    <Badge variant="outline" className="border-amber-500 text-amber-700">
                                                        Threshold {repeatedAbsenceThreshold}+ reached
                                                    </Badge>
                                                ) : (
                                                    <span className="text-muted-foreground">
                                                        {attendance.absence_count} absence(s)
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-6 text-center text-sm text-muted-foreground">
                                            No attendance records match the current filters.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    {attendances.links.map((link, index) => (
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
