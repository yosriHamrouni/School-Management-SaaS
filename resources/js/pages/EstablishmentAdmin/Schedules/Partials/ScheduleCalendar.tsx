import type { DateSelectArg, EventClickArg, EventContentArg, EventInput, EventSourceFuncArg } from '@fullcalendar/core';
import interactionPlugin from '@fullcalendar/interaction';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import { RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import {
    colorizeScheduleEvents,
    EmptyScheduleState,
    eventPrimaryLabel,
    eventSecondaryLine,
    eventTimeRange,
} from '@/pages/EstablishmentAdmin/Schedules/Partials/schedule-ui';
import type {
    ScheduleAudience,
    ScheduleCalendarEvent,
    ScheduleEventProps,
} from '@/pages/EstablishmentAdmin/Schedules/Partials/schedule-ui';

type ScheduleFilters = {
    search?: string;
    class_id?: string;
    subject_id?: string;
    teacher_id?: string;
    day_of_week?: string;
};

type ClientFilter = {
    field: keyof ScheduleEventProps;
    value: string;
};

type ScheduleCalendarStyle = CSSProperties & {
    '--schedule-slot-height': string;
    '--schedule-event-scale': number;
};

type ScheduleCalendarProps = {
    feedUrl: string;
    filters?: ScheduleFilters;
    clientFilters?: ClientFilter[];
    readOnly?: boolean;
    refreshKey?: number;
    audience?: ScheduleAudience;
    colorBy?: keyof ScheduleEventProps;
    title?: string;
    description?: string;
    emptyTitle?: string;
    emptyDescription?: string;
    onEventsLoaded?: (events: ScheduleCalendarEvent[]) => void;
    onSelectSlot?: (selectionInfo: DateSelectArg) => void;
    onEventSelect?: (clickInfo: EventClickArg) => void;
};

export default function ScheduleCalendar({
    feedUrl,
    filters,
    clientFilters = [],
    readOnly = false,
    refreshKey = 0,
    audience = 'admin',
    colorBy = 'subject_name',
    title = 'Weekly timetable',
    description = 'Use the calendar controls to move between weeks and inspect sessions.',
    emptyTitle = 'No sessions in this view',
    emptyDescription = 'There are no scheduled lessons for the selected week or filters.',
    onEventsLoaded,
    onSelectSlot,
    onEventSelect,
}: ScheduleCalendarProps) {
    const calendarRef = useRef<FullCalendar | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [hasLoaded, setHasLoaded] = useState(false);
    const [eventCount, setEventCount] = useState(0);
    const [zoomLevel, setZoomLevel] = useState(1);

    const normalizedFilters = useMemo(() => ({
        search: filters?.search ?? '',
        class_id: filters?.class_id ?? '',
        subject_id: filters?.subject_id ?? '',
        teacher_id: filters?.teacher_id ?? '',
        day_of_week: filters?.day_of_week ?? '',
    }), [filters?.class_id, filters?.day_of_week, filters?.search, filters?.subject_id, filters?.teacher_id]);

    const clientFilterKey = clientFilters.map((filter) => `${filter.field}:${filter.value}`).join('|');
    const normalizedClientFilters = useMemo(
        () => clientFilters.filter((filter) => filter.value !== ''),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [clientFilterKey],
    );

    const loadEvents = useCallback(
        async (
            fetchInfo: EventSourceFuncArg,
            successCallback: (events: EventInput[]) => void,
            failureCallback: (error: Error) => void,
        ) => {
            setLoadError(null);

            try {
                const params = new URLSearchParams({
                    start: fetchInfo.startStr,
                    end: fetchInfo.endStr,
                });

                Object.entries(normalizedFilters).forEach(([key, value]) => {
                    if (value) {
                        params.set(key, value);
                    }
                });

                const response = await fetch(`${feedUrl}?${params.toString()}`, {
                    headers: {
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                    credentials: 'same-origin',
                });

                if (!response.ok) {
                    throw new Error('Unable to load calendar events.');
                }

                const payload = (await response.json()) as ScheduleCalendarEvent[];
                const filteredPayload = normalizedClientFilters.reduce(
                    (currentEvents, filter) =>
                        currentEvents.filter(
                            (event) => String(event.extendedProps?.[filter.field] ?? '') === filter.value,
                        ),
                    payload,
                );
                const colorizedPayload = colorizeScheduleEvents(filteredPayload, colorBy);

                setHasLoaded(true);
                setEventCount(colorizedPayload.length);
                onEventsLoaded?.(colorizedPayload);
                successCallback(colorizedPayload);
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Unable to load calendar events.';

                setHasLoaded(true);
                setEventCount(0);
                setLoadError(message);
                onEventsLoaded?.([]);
                failureCallback(error instanceof Error ? error : new Error(message));
            }
        },
        [colorBy, feedUrl, normalizedClientFilters, normalizedFilters, onEventsLoaded],
    );

    useEffect(() => {
        const handleResize = () => {
            const calendarApi = calendarRef.current?.getApi();

            if (!calendarApi) {
                return;
            }

            calendarApi.changeView(window.innerWidth < 768 ? 'timeGridDay' : 'timeGridWeek');
        };

        handleResize();
        window.addEventListener('resize', handleResize);

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        calendarRef.current?.getApi().refetchEvents();
    }, [normalizedFilters, normalizedClientFilters, feedUrl, refreshKey]);

    useEffect(() => {
        calendarRef.current?.getApi().updateSize();
    }, [zoomLevel]);

    const calendarStyle = useMemo<ScheduleCalendarStyle>(
        () => ({
            '--schedule-slot-height': `${2.6 * zoomLevel}rem`,
            '--schedule-event-scale': zoomLevel,
        }),
        [zoomLevel],
    );

    const decreaseZoom = () => setZoomLevel((current) => Math.max(0.75, Number((current - 0.1).toFixed(2))));
    const increaseZoom = () => setZoomLevel((current) => Math.min(1.35, Number((current + 0.1).toFixed(2))));
    const resetZoom = () => setZoomLevel(1);

    return (
        <div className="rounded-lg border border-sidebar-border/70 bg-card shadow-sm">
            <div className="flex flex-col gap-2 border-b border-border px-4 py-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h2 className="text-lg font-semibold">{title}</h2>
                    <p className="text-sm text-muted-foreground">{description}</p>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                        {loading ? <Spinner className="size-4" /> : null}
                        <span>{loading ? 'Loading timetable' : `${eventCount} session(s)`}</span>
                    </div>

                    <div className="flex items-center rounded-md border border-border bg-background p-1">
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-7"
                            onClick={decreaseZoom}
                            disabled={zoomLevel <= 0.75}
                            aria-label="Zoom out schedule"
                            title="Zoom out"
                        >
                            <ZoomOut className="size-4" />
                        </Button>
                        <button
                            type="button"
                            className="min-w-12 px-2 text-xs font-medium text-muted-foreground"
                            onClick={resetZoom}
                            aria-label="Reset schedule zoom"
                            title="Reset zoom"
                        >
                            {Math.round(zoomLevel * 100)}%
                        </button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-7"
                            onClick={resetZoom}
                            disabled={zoomLevel === 1}
                            aria-label="Reset schedule zoom"
                            title="Reset zoom"
                        >
                            <RotateCcw className="size-4" />
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-7"
                            onClick={increaseZoom}
                            disabled={zoomLevel >= 1.35}
                            aria-label="Zoom in schedule"
                            title="Zoom in"
                        >
                            <ZoomIn className="size-4" />
                        </Button>
                    </div>
                </div>
            </div>

            <div className="schedule-calendar relative p-3 md:p-4" style={calendarStyle}>
                <FullCalendar
                    ref={calendarRef}
                    plugins={[timeGridPlugin, interactionPlugin]}
                    initialView={typeof window !== 'undefined' && window.innerWidth < 768 ? 'timeGridDay' : 'timeGridWeek'}
                    headerToolbar={{
                        left: 'prev,next today',
                        center: 'title',
                        right: 'timeGridWeek,timeGridDay',
                    }}
                    views={{
                        timeGridWeek: { buttonText: 'Week' },
                        timeGridDay: { buttonText: 'Day' },
                    }}
                    firstDay={1}
                    allDaySlot={false}
                    selectable={!readOnly}
                    selectMirror={!readOnly}
                    editable={false}
                    weekends
                    nowIndicator
                    height="auto"
                    expandRows
                    stickyHeaderDates
                    slotMinTime="07:00:00"
                    slotMaxTime="20:00:00"
                    loading={setLoading}
                    events={loadEvents}
                    select={onSelectSlot}
                    eventClick={onEventSelect}
                    eventContent={(eventInfo) => renderScheduleEvent(eventInfo, audience)}
                    eventTimeFormat={{
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false,
                    }}
                    dayHeaderFormat={{ weekday: 'long', day: 'numeric', month: 'short' }}
                />
            </div>

            {loadError ? (
                <div className="mx-4 mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {loadError}
                </div>
            ) : null}

            {!loadError && hasLoaded && eventCount === 0 ? (
                <div className="px-4 pb-4">
                    <EmptyScheduleState title={emptyTitle} description={emptyDescription} />
                </div>
            ) : null}
        </div>
    );
}

function renderScheduleEvent(eventInfo: EventContentArg, audience: ScheduleAudience) {
    const event: ScheduleCalendarEvent = {
        id: eventInfo.event.id,
        title: eventInfo.event.title,
        extendedProps: eventInfo.event.extendedProps as ScheduleEventProps,
        ...(eventInfo.event.start ? { start: eventInfo.event.start } : {}),
        ...(eventInfo.event.end ? { end: eventInfo.event.end } : {}),
    };
    const secondaryLine = eventSecondaryLine(event, audience);

    return (
        <div className="min-w-0 px-1 py-0.5">
            <div className="truncate text-[11px] font-semibold leading-4">{eventTimeRange(event)}</div>
            <div className="truncate text-xs font-semibold leading-4">{eventPrimaryLabel(event, audience)}</div>
            {secondaryLine ? (
                <div className="truncate text-[11px] leading-4 opacity-80">{secondaryLine}</div>
            ) : null}
        </div>
    );
}
