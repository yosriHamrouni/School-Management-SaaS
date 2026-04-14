import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useMemo } from 'react';
import InputError from '@/components/input-error';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import FlashAlerts from '@/components/ui/flash-alerts';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type StudentAttendanceRow = {
    student_id: number;
    name: string;
    student_number: string | null;
    status: string;
    justification: string;
    recorded_at: string | null;
    absence_count: number;
    has_repeated_absences: boolean;
};

type Props = {
    schedule: {
        id: number;
        class_name: string | null;
        subject_name: string | null;
        day_of_week: string;
        start_time: string;
        end_time: string;
    };
    students: StudentAttendanceRow[];
    statusOptions: string[];
    repeatedAbsenceThreshold: number;
    flash?: {
        success?: string | null;
        error?: string | null;
    };
};

type AttendanceFormRow = {
    student_id: number;
    status: string;
    justification: string;
};

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

export default function TeacherAttendancesEdit({
    schedule,
    students,
    statusOptions,
    repeatedAbsenceThreshold,
}: Props) {
    const { flash } = usePage<Props>().props;
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Attendance', href: '/teacher/attendances' },
        { title: schedule.class_name ?? 'Session', href: '#' },
    ];

    const form = useForm<{ schedule_id: number; students: AttendanceFormRow[] }>({
        schedule_id: schedule.id,
        students: students.map((student) => ({
            student_id: student.student_id,
            status: student.status,
            justification: student.justification,
        })),
    });

    const flaggedStudents = students.filter((student) => student.has_repeated_absences);

    const summary = useMemo(
        () =>
            form.data.students.reduce(
                (totals, row) => ({
                    present: totals.present + (row.status === 'present' ? 1 : 0),
                    absent: totals.absent + (row.status === 'absent' ? 1 : 0),
                    late: totals.late + (row.status === 'late' ? 1 : 0),
                }),
                { present: 0, absent: 0, late: 0 },
            ),
        [form.data.students],
    );

    const updateRow = (index: number, changes: Partial<AttendanceFormRow>) => {
        const nextRows = [...form.data.students];
        nextRows[index] = {
            ...nextRows[index],
            ...changes,
        };
        form.setData('students', nextRows);
    };

    const markAllAsPresent = () => {
        form.setData(
            'students',
            form.data.students.map((row) => ({
                ...row,
                status: 'present',
                justification: '',
            })),
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Record Attendance" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div className="rounded-xl border border-sidebar-border/70 bg-background p-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div>
                            <h1 className="text-2xl font-semibold">Record Attendance</h1>
                            <p className="mt-2 text-sm text-muted-foreground">
                                {schedule.class_name ?? '-'} | {schedule.subject_name ?? '-'} | {schedule.day_of_week} {schedule.start_time} - {schedule.end_time}
                            </p>
                        </div>

                        <div className="flex gap-2">
                            <Button variant="outline" asChild>
                                <Link href="/teacher/attendances">Back to sessions</Link>
                            </Button>
                            <Button variant="outline" asChild>
                                <Link href="/teacher/attendances/history">Open history</Link>
                            </Button>
                        </div>
                    </div>
                </div>

                <FlashAlerts flash={flash} />

                {flaggedStudents.length > 0 ? (
                    <Alert className="border-amber-200 bg-amber-50 text-amber-900">
                        <AlertTitle>Repeated absences detected</AlertTitle>
                        <AlertDescription>
                            {flaggedStudents.length} student(s) have reached the threshold of {repeatedAbsenceThreshold} absences or more in your sessions.
                        </AlertDescription>
                    </Alert>
                ) : null}

                <div className="grid gap-4 md:grid-cols-3">
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

                <div className="overflow-hidden rounded-xl border border-sidebar-border/70 bg-background">
                    <form
                        onSubmit={(event) => {
                            event.preventDefault();
                            form.post('/teacher/attendances');
                        }}
                    >
                        <div className="flex items-center justify-between border-b border-border px-4 py-4">
                            <p className="text-sm text-muted-foreground">
                                Existing records are preloaded. Saving updates the attendance for this session.
                            </p>
                            <Button type="button" variant="outline" onClick={markAllAsPresent}>
                                Mark all present
                            </Button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-border">
                                <thead className="bg-muted/50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Student</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Student #</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Justification</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Alert</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {students.map((student, index) => {
                                        const currentRow = form.data.students[index];
                                        const showJustification =
                                            currentRow?.status === 'absent' || currentRow?.status === 'late';

                                        return (
                                            <tr key={student.student_id} className="align-top hover:bg-muted/30">
                                                <td className="px-4 py-3 text-sm">
                                                    <div className="font-medium">{student.name}</div>
                                                    {student.recorded_at ? (
                                                        <div className="mt-1 text-xs text-muted-foreground">
                                                            Last saved: {new Date(student.recorded_at).toLocaleString()}
                                                        </div>
                                                    ) : null}
                                                </td>
                                                <td className="px-4 py-3 text-sm">{student.student_number ?? '-'}</td>
                                                <td className="px-4 py-3">
                                                    <select
                                                        value={currentRow?.status ?? 'present'}
                                                        onChange={(event) =>
                                                            updateRow(index, {
                                                                status: event.target.value,
                                                                justification:
                                                                    event.target.value === 'present'
                                                                        ? ''
                                                                        : currentRow?.justification ?? '',
                                                            })
                                                        }
                                                        className={selectClassName}
                                                    >
                                                        {statusOptions.map((status) => (
                                                            <option key={status} value={status}>
                                                                {statusLabel(status)}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <InputError
                                                        message={
                                                            form.errors[
                                                                `students.${index}.status` as keyof typeof form.errors
                                                            ]
                                                        }
                                                        className="mt-1"
                                                    />
                                                </td>
                                                <td className="px-4 py-3">
                                                    {showJustification ? (
                                                        <>
                                                            <Input
                                                                value={currentRow?.justification ?? ''}
                                                                onChange={(event) =>
                                                                    updateRow(index, {
                                                                        justification: event.target.value,
                                                                    })
                                                                }
                                                                placeholder="Optional justification"
                                                            />
                                                            <InputError
                                                                message={
                                                                    form.errors[
                                                                        `students.${index}.justification` as keyof typeof form.errors
                                                                    ]
                                                                }
                                                                className="mt-1"
                                                            />
                                                        </>
                                                    ) : (
                                                        <span className="text-sm text-muted-foreground">
                                                            Not required for present students
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-sm">
                                                    <div className="flex flex-col gap-2">
                                                        <Badge variant={statusBadgeVariant(currentRow?.status ?? 'present')}>
                                                            {statusLabel(currentRow?.status ?? 'present')}
                                                        </Badge>
                                                        {student.has_repeated_absences ? (
                                                            <Badge variant="outline" className="border-amber-500 text-amber-700">
                                                                {student.absence_count} absences
                                                            </Badge>
                                                        ) : (
                                                            <span className="text-muted-foreground">
                                                                {student.absence_count} tracked absence(s)
                                                            </span>
                                                        )}
                                                    </div>
                                                    <InputError
                                                        message={
                                                            form.errors[
                                                                `students.${index}.student_id` as keyof typeof form.errors
                                                            ]
                                                        }
                                                        className="mt-2"
                                                    />
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex justify-end border-t border-border px-4 py-4">
                            <Button type="submit" disabled={form.processing}>
                                Save attendance
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
