import { Head } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import {
    buildScheduleSummaries,
    SchedulePageHeader,
    ScheduleSummaryCards,
} from '@/pages/EstablishmentAdmin/Schedules/Partials/schedule-ui';
import type { ScheduleCalendarEvent } from '@/pages/EstablishmentAdmin/Schedules/Partials/schedule-ui';
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
    const [events, setEvents] = useState<ScheduleCalendarEvent[]>([]);
    const summaries = useMemo(() => buildScheduleSummaries(events, 'student'), [events]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="My Schedule" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <SchedulePageHeader
                    title="My Schedule"
                    subtitle="View your weekly class timetable and upcoming lessons."
                    eyebrow="Student timetable"
                    meta={
                        className ? (
                            <Badge variant="secondary" className="font-normal">
                                {className}
                            </Badge>
                        ) : null
                    }
                />

                <ScheduleSummaryCards items={summaries} />

                <ScheduleCalendar
                    feedUrl={calendarFeedUrl}
                    readOnly
                    audience="student"
                    colorBy="subject_name"
                    title="Weekly class calendar"
                    description={
                        className
                            ? `Read-only timetable for ${className}.`
                            : 'No class is currently assigned to your student profile.'
                    }
                    emptyTitle="No lessons scheduled"
                    emptyDescription="Your class does not have scheduled lessons in the selected calendar range."
                    onEventsLoaded={setEvents}
                />
            </div>
        </AppLayout>
    );
}
