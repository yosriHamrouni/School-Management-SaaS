import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import ScheduleCalendar from '@/pages/EstablishmentAdmin/Schedules/Partials/ScheduleCalendar';
import type { BreadcrumbItem } from '@/types';

type Props = {
    calendarFeedUrl: string;
    className: string | null;
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Class Schedule',
        href: '/student/schedules',
    },
];

export default function StudentSchedulesIndex({ calendarFeedUrl, className }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Class Schedule" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div className="rounded-xl border border-sidebar-border/70 bg-background p-6">
                    <h1 className="text-2xl font-semibold">Class Schedule</h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                        {className
                            ? `Read-only weekly timetable for ${className}.`
                            : 'No class is currently assigned to your student profile.'}
                    </p>
                </div>

                <ScheduleCalendar feedUrl={calendarFeedUrl} readOnly />
            </div>
        </AppLayout>
    );
}
