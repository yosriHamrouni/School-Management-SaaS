import type { DateSelectArg, EventClickArg } from '@fullcalendar/core';
import { Head, Link, router } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import FlashAlerts from '@/components/ui/flash-alerts';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import {
    buildScheduleSummaries,
    legendItems,
    SchedulePageHeader,
    ScheduleSummaryCards,
} from '@/pages/EstablishmentAdmin/Schedules/Partials/schedule-ui';
import type { ScheduleCalendarEvent } from '@/pages/EstablishmentAdmin/Schedules/Partials/schedule-ui';
import ScheduleCalendar from '@/pages/EstablishmentAdmin/Schedules/Partials/ScheduleCalendar';
import ScheduleFormModal from '@/pages/EstablishmentAdmin/Schedules/Partials/ScheduleFormModal';
import type { ScheduleModalData } from '@/pages/EstablishmentAdmin/Schedules/Partials/ScheduleFormModal';
import type { BreadcrumbItem } from '@/types';

type Option = {
    id: number;
    name: string;
};

type Schedule = {
    id: number;
    class_name: string | null;
    subject_name: string | null;
    teacher_name: string | null;
    day_of_week: string;
    start_time: string;
    end_time: string;
};

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type PaginationData = {
    data: Schedule[];
    links: PaginationLink[];
};

type Filters = {
    search: string;
    class_id: string;
    teacher_id: string;
    subject_id: string;
    day_of_week: string;
};

type PageProps = {
    filters: Filters;
    schedules: PaginationData;
    classes: Option[];
    subjects: Option[];
    teachers: Option[];
    dayOptions: string[];
    calendarFeedUrl: string;
    flash?: {
        success?: string | null;
        error?: string | null;
    };
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Schedules',
        href: '/establishment-admin/schedules',
    },
];

const selectClassName =
    'border-input focus-visible:border-ring focus-visible:ring-ring/50 h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus-visible:ring-[3px]';

const emptyModalData: ScheduleModalData = {
    id: null,
    class_id: '',
    subject_id: '',
    teacher_id: '',
    day_of_week: '',
    start_time: '',
    end_time: '',
};

function toTimeString(date: Date): string {
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export default function SchedulesIndex({
    filters: initialFilters,
    schedules,
    classes,
    subjects,
    teachers,
    dayOptions,
    calendarFeedUrl,
    flash,
}: PageProps) {
    const [filters, setFilters] = useState<Filters>({
        search: initialFilters.search ?? '',
        class_id: initialFilters.class_id ?? '',
        teacher_id: initialFilters.teacher_id ?? '',
        subject_id: initialFilters.subject_id ?? '',
        day_of_week: initialFilters.day_of_week ?? '',
    });
    const [modalOpen, setModalOpen] = useState(false);
    const [modalData, setModalData] = useState<ScheduleModalData>(emptyModalData);
    const [refreshKey, setRefreshKey] = useState(0);
    const [events, setEvents] = useState<ScheduleCalendarEvent[]>([]);

    const activeFilterCount = useMemo(
        () => Object.values(filters).filter((value) => value !== '').length,
        [filters],
    );
    const summaries = useMemo(() => buildScheduleSummaries(events, 'admin'), [events]);
    const legend = useMemo(() => legendItems(events, 'class_name'), [events]);

    const applyFilters = () => {
        router.get('/establishment-admin/schedules', filters, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const resetFilters = () => {
        const nextFilters = {
            search: '',
            class_id: '',
            teacher_id: '',
            subject_id: '',
            day_of_week: '',
        };

        setFilters(nextFilters);

        router.get('/establishment-admin/schedules', nextFilters, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const openCreateModal = () => {
        setModalData({
            ...emptyModalData,
            class_id: filters.class_id,
            subject_id: filters.subject_id,
            teacher_id: filters.teacher_id,
            day_of_week: filters.day_of_week,
        });
        setModalOpen(true);
    };

    const handleSlotSelect = (selectionInfo: DateSelectArg) => {
        setModalData({
            id: null,
            class_id: filters.class_id,
            subject_id: filters.subject_id,
            teacher_id: filters.teacher_id,
            day_of_week: selectionInfo.start.toLocaleDateString('en-US', { weekday: 'long' }),
            start_time: toTimeString(selectionInfo.start),
            end_time: toTimeString(selectionInfo.end),
        });
        setModalOpen(true);
    };

    const handleEventSelect = (clickInfo: EventClickArg) => {
        const props = clickInfo.event.extendedProps as Record<string, string | number | null | undefined>;

        setModalData({
            id: Number(props.schedule_id ?? clickInfo.event.id),
            class_id: String(props.class_id ?? ''),
            subject_id: String(props.subject_id ?? ''),
            teacher_id: String(props.teacher_id ?? ''),
            day_of_week: String(props.day_of_week ?? ''),
            start_time: String(props.start_time ?? ''),
            end_time: String(props.end_time ?? ''),
        });
        setModalOpen(true);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Schedule Management" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <SchedulePageHeader
                    title="Schedule Management"
                    subtitle="Create, organize and monitor class timetables across the establishment."
                    eyebrow="Administration"
                    action={
                        <Button onClick={openCreateModal}>
                            <Plus className="size-4" />
                            Add schedule
                        </Button>
                    }
                />

                <FlashAlerts flash={flash} />

                <ScheduleSummaryCards items={summaries} />

                <div className="rounded-lg border border-sidebar-border/70 bg-card p-4 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-semibold">Filters</h2>
                            <p className="text-sm text-muted-foreground">
                                Filters are applied to both the calendar and the list.
                            </p>
                        </div>
                        <div className="text-sm text-muted-foreground">
                            {activeFilterCount} active filter(s)
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                        <Input
                            value={filters.search}
                            onChange={(event) =>
                                setFilters((current) => ({
                                    ...current,
                                    search: event.target.value,
                                }))
                            }
                            placeholder="Search class, subject, teacher or time"
                        />

                        <select
                            value={filters.class_id}
                            onChange={(event) =>
                                setFilters((current) => ({
                                    ...current,
                                    class_id: event.target.value,
                                }))
                            }
                            className={selectClassName}
                        >
                            <option value="">All classes</option>
                            {classes.map((schoolClass) => (
                                <option key={schoolClass.id} value={String(schoolClass.id)}>
                                    {schoolClass.name}
                                </option>
                            ))}
                        </select>

                        <select
                            value={filters.subject_id}
                            onChange={(event) =>
                                setFilters((current) => ({
                                    ...current,
                                    subject_id: event.target.value,
                                }))
                            }
                            className={selectClassName}
                        >
                            <option value="">All subjects</option>
                            {subjects.map((subject) => (
                                <option key={subject.id} value={String(subject.id)}>
                                    {subject.name}
                                </option>
                            ))}
                        </select>

                        <select
                            value={filters.teacher_id}
                            onChange={(event) =>
                                setFilters((current) => ({
                                    ...current,
                                    teacher_id: event.target.value,
                                }))
                            }
                            className={selectClassName}
                        >
                            <option value="">All teachers</option>
                            {teachers.map((teacher) => (
                                <option key={teacher.id} value={String(teacher.id)}>
                                    {teacher.name}
                                </option>
                            ))}
                        </select>

                        <select
                            value={filters.day_of_week}
                            onChange={(event) =>
                                setFilters((current) => ({
                                    ...current,
                                    day_of_week: event.target.value,
                                }))
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
                    </div>

                    <div className="mt-4 flex gap-2">
                        <Button type="button" onClick={applyFilters}>
                            Apply filters
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={resetFilters}
                        >
                            Reset filters
                        </Button>
                    </div>

                    {legend.length > 0 ? (
                        <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
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
                    filters={filters}
                    refreshKey={refreshKey}
                    audience="admin"
                    colorBy="class_name"
                    title="Planning calendar"
                    description="Select a free slot to create a session, or select an event to update it."
                    emptyTitle="No schedules found"
                    emptyDescription="No sessions match the selected week or filters. Create one from the button above or by selecting a slot."
                    onEventsLoaded={setEvents}
                    onSelectSlot={handleSlotSelect}
                    onEventSelect={handleEventSelect}
                />

                <div className="rounded-lg border border-sidebar-border/70 bg-card shadow-sm">
                    <div className="border-b border-border px-4 py-4">
                        <h2 className="text-lg font-semibold">Administrative list</h2>
                        <p className="text-sm text-muted-foreground">
                            Use the table for quick scanning and detail access.
                        </p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-border">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Class</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Subject</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Teacher</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Day</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Start</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">End</th>
                                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {schedules.data.length > 0 ? (
                                    schedules.data.map((schedule) => (
                                        <tr key={schedule.id} className="hover:bg-muted/30">
                                            <td className="px-4 py-3 text-sm">{schedule.class_name ?? '-'}</td>
                                            <td className="px-4 py-3 text-sm">{schedule.subject_name ?? '-'}</td>
                                            <td className="px-4 py-3 text-sm">{schedule.teacher_name ?? '-'}</td>
                                            <td className="px-4 py-3 text-sm">{schedule.day_of_week}</td>
                                            <td className="px-4 py-3 text-sm">{schedule.start_time}</td>
                                            <td className="px-4 py-3 text-sm">{schedule.end_time}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        asChild
                                                    >
                                                        <Link href={`/establishment-admin/schedules/${schedule.id}`}>
                                                            View
                                                        </Link>
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() =>
                                                            router.visit(`/establishment-admin/schedules/${schedule.id}/edit`)
                                                        }
                                                    >
                                                        Edit
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-6 text-center text-sm text-muted-foreground">
                                            No schedules found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex flex-wrap gap-2 px-4 py-4">
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
            </div>

            <ScheduleFormModal
                key={
                    modalOpen
                        ? `${modalData.id ?? 'new'}-${modalData.day_of_week}-${modalData.start_time}-${modalData.end_time}`
                        : 'schedule-modal-closed'
                }
                open={modalOpen}
                onOpenChange={setModalOpen}
                initialData={modalData}
                classes={classes}
                subjects={subjects}
                teachers={teachers}
                dayOptions={dayOptions}
                onSaved={() => setRefreshKey((current) => current + 1)}
            />
        </AppLayout>
    );
}
