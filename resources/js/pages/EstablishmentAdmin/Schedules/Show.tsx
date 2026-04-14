import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type Schedule = {
    id: number;
    class_name: string | null;
    subject_name: string | null;
    teacher_name: string | null;
    teacher_email: string | null;
    created_by_name: string | null;
    day_of_week: string;
    start_time: string;
    end_time: string;
};

type Props = {
    schedule: Schedule;
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Schedules',
        href: '/establishment-admin/schedules',
    },
    {
        title: 'Details',
        href: '#',
    },
];

const detailRows = (schedule: Schedule) => [
    { label: 'Class', value: schedule.class_name ?? '-' },
    { label: 'Subject', value: schedule.subject_name ?? '-' },
    { label: 'Teacher', value: schedule.teacher_name ?? '-' },
    { label: 'Teacher Email', value: schedule.teacher_email ?? '-' },
    { label: 'Created By', value: schedule.created_by_name ?? '-' },
    { label: 'Day', value: schedule.day_of_week },
    { label: 'Start Time', value: schedule.start_time },
    { label: 'End Time', value: schedule.end_time },
];

export default function SchedulesShow({ schedule }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Schedule Details" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div className="rounded-xl border border-sidebar-border/70 bg-background p-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h1 className="text-2xl font-semibold">{schedule.class_name ?? 'Schedule'}</h1>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Session details for the selected time slot.
                            </p>
                        </div>

                        <div className="flex gap-2">
                            <Button variant="outline" asChild>
                                <Link href="/establishment-admin/schedules">Back</Link>
                            </Button>
                            <Button asChild>
                                <Link href={`/establishment-admin/schedules/${schedule.id}/edit`}>Edit</Link>
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="rounded-xl border border-sidebar-border/70 bg-background p-6">
                    <div className="grid gap-4 md:grid-cols-2">
                        {detailRows(schedule).map((row) => (
                            <div key={row.label} className="rounded-lg border border-border p-4">
                                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                    {row.label}
                                </p>
                                <p className="mt-2 text-sm text-foreground">{row.value}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
