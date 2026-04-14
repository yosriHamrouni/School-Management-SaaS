import { useEffect, useMemo, useRef, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import interactionPlugin from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';
import type { DateSelectArg, EventClickArg, EventInput } from '@fullcalendar/core';

type ScheduleFilters = {
    search?: string;
    class_id?: string;
    subject_id?: string;
    teacher_id?: string;
    day_of_week?: string;
};

type ScheduleCalendarProps = {
    feedUrl: string;
    filters?: ScheduleFilters;
    readOnly?: boolean;
    refreshKey?: number;
    onSelectSlot?: (selectionInfo: DateSelectArg) => void;
    onEventSelect?: (clickInfo: EventClickArg) => void;
};

export default function ScheduleCalendar({
    feedUrl,
    filters,
    readOnly = false,
    refreshKey = 0,
    onSelectSlot,
    onEventSelect,
}: ScheduleCalendarProps) {
    const calendarRef = useRef<FullCalendar | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);

    const normalizedFilters = useMemo(() => ({
        search: filters?.search ?? '',
        class_id: filters?.class_id ?? '',
        subject_id: filters?.subject_id ?? '',
        teacher_id: filters?.teacher_id ?? '',
        day_of_week: filters?.day_of_week ?? '',
    }), [filters?.class_id, filters?.day_of_week, filters?.search, filters?.subject_id, filters?.teacher_id]);

    useEffect(() => {
        calendarRef.current?.getApi().refetchEvents();
    }, [normalizedFilters, feedUrl, refreshKey]);

    return (
        <div className="rounded-xl border border-sidebar-border/70 bg-background p-4">
            <FullCalendar
                ref={calendarRef}
                plugins={[timeGridPlugin, interactionPlugin]}
                initialView="timeGridWeek"
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
                slotMinTime="07:00:00"
                slotMaxTime="20:00:00"
                events={async (fetchInfo, successCallback, failureCallback) => {
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

                        const payload = (await response.json()) as EventInput[];
                        successCallback(payload);
                    } catch (error) {
                        const message = error instanceof Error ? error.message : 'Unable to load calendar events.';
                        setLoadError(message);
                        failureCallback(error instanceof Error ? error : new Error(message));
                    }
                }}
                select={onSelectSlot}
                eventClick={onEventSelect}
                eventTimeFormat={{
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                }}
                dayHeaderFormat={{ weekday: 'long', day: 'numeric', month: 'short' }}
            />

            {loadError ? (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {loadError}
                </div>
            ) : null}
        </div>
    );
}
