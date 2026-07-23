import { Head } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import {
    buildScheduleSummaries,
    FilterSelect,
    legendItems,
    SchedulePageHeader,
    ScheduleSummaryCards,
} from '@/pages/EstablishmentAdmin/Schedules/Partials/schedule-ui';
import type { ScheduleCalendarEvent } from '@/pages/EstablishmentAdmin/Schedules/Partials/schedule-ui';
import ScheduleCalendar from '@/pages/EstablishmentAdmin/Schedules/Partials/ScheduleCalendar';
import type { BreadcrumbItem } from '@/types';

type Props = {
    calendarFeedUrl: string;
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'My Schedule',
        href: '/teacher/schedules',
    },
];

export default function TeacherSchedulesIndex({ calendarFeedUrl }: Props) {
    const [events, setEvents] = useState<ScheduleCalendarEvent[]>([]);
    const [classFilter, setClassFilter] = useState('');
    const [subjectFilter, setSubjectFilter] = useState('');
    const summaries = useMemo(() => buildScheduleSummaries(events, 'teacher'), [events]);
    const classOptions = useMemo(() => uniqueEventOptions(events, 'class_name'), [events]);
    const subjectOptions = useMemo(() => uniqueEventOptions(events, 'subject_name'), [events]);
    const legend = useMemo(() => legendItems(events, 'class_name'), [events]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Teaching Schedule" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <SchedulePageHeader
                    title="Teaching Schedule"
                    subtitle="Track your weekly teaching sessions, classes and rooms."
                    eyebrow="Teacher timetable"
                />

                <ScheduleSummaryCards items={summaries} />

                <div className="rounded-lg border border-sidebar-border/70 bg-card p-4 shadow-sm">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h2 className="text-lg font-semibold">Focus filters</h2>
                            <p className="text-sm text-muted-foreground">
                                Narrow the calendar by class or subject using the sessions already loaded.
                            </p>
                        </div>

                        <div className="grid gap-2 sm:grid-cols-2 md:w-[28rem]">
                            <FilterSelect
                                value={classFilter}
                                onChange={setClassFilter}
                                options={classOptions}
                                placeholder="All classes"
                            />
                            <FilterSelect
                                value={subjectFilter}
                                onChange={setSubjectFilter}
                                options={subjectOptions}
                                placeholder="All subjects"
                            />
                        </div>
                    </div>

                    {legend.length > 0 ? (
                        <div className="mt-4 flex flex-wrap gap-2">
                            {legend.map((item) => (
                                <span
                                    key={item.label}
                                    className="inline-flex items-center gap-2 rounded-md border border-border px-2.5 py-1 text-xs text-muted-foreground"
                                >
                                    <span
                                        className="size-2.5 rounded-full"
                                        style={{ backgroundColor: item.color }}
                                    />
                                    {item.label}
                                </span>
                            ))}
                        </div>
                    ) : null}
                </div>

                <ScheduleCalendar
                    feedUrl={calendarFeedUrl}
                    readOnly
                    audience="teacher"
                    colorBy="class_name"
                    clientFilters={[
                        { field: 'class_name', value: classFilter },
                        { field: 'subject_name', value: subjectFilter },
                    ]}
                    title="Weekly teaching calendar"
                    description="Read-only view of your assigned teaching sessions."
                    emptyTitle="No teaching sessions found"
                    emptyDescription="No sessions match the selected week or filters."
                    onEventsLoaded={setEvents}
                />
            </div>
        </AppLayout>
    );
}

function uniqueEventOptions(events: ScheduleCalendarEvent[], key: 'class_name' | 'subject_name'): string[] {
    return Array.from(
        new Set(
            events
                .map((event) => event.extendedProps?.[key])
                .filter((value): value is string => Boolean(value)),
        ),
    ).sort((first, second) => first.localeCompare(second));
}
