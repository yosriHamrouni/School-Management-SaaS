import type { EventInput } from '@fullcalendar/core';
import { BookOpen, CalendarDays, Clock, GraduationCap, Layers, Users } from 'lucide-react';
import type { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type ScheduleAudience = 'student' | 'teacher' | 'admin';

export type ScheduleEventProps = {
    schedule_id?: number | string | null;
    day_of_week?: string | null;
    start_time?: string | null;
    end_time?: string | null;
    class_id?: number | string | null;
    class_name?: string | null;
    subject_id?: number | string | null;
    subject_name?: string | null;
    teacher_id?: number | string | null;
    teacher_name?: string | null;
    room_name?: string | null;
};

export type ScheduleCalendarEvent = EventInput & {
    extendedProps?: ScheduleEventProps;
};

export type ScheduleSummaryItem = {
    label: string;
    value: string;
    caption?: string;
    icon?: ReactNode;
};

type SchedulePageHeaderProps = {
    title: string;
    subtitle: string;
    eyebrow?: string;
    meta?: ReactNode;
    action?: ReactNode;
};

type ScheduleSummaryCardsProps = {
    items: ScheduleSummaryItem[];
};

const colorPalette = [
    { background: '#eff6ff', border: '#2563eb', text: '#1e3a8a' },
    { background: '#ecfdf5', border: '#059669', text: '#064e3b' },
    { background: '#fff7ed', border: '#ea580c', text: '#7c2d12' },
    { background: '#fdf2f8', border: '#db2777', text: '#831843' },
    { background: '#f0fdfa', border: '#0d9488', text: '#134e4a' },
    { background: '#f5f3ff', border: '#7c3aed', text: '#4c1d95' },
];

const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function SchedulePageHeader({
    title,
    subtitle,
    eyebrow = 'Schedules',
    meta,
    action,
}: SchedulePageHeaderProps) {
    return (
        <section className="rounded-lg border border-sidebar-border/70 bg-card px-5 py-5 shadow-sm md:px-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary">
                            {eyebrow}
                        </Badge>
                        {meta}
                    </div>
                    <h1 className="mt-3 text-2xl font-semibold tracking-normal text-foreground md:text-3xl">
                        {title}
                    </h1>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                        {subtitle}
                    </p>
                </div>

                {action ? <div className="shrink-0">{action}</div> : null}
            </div>
        </section>
    );
}

export function ScheduleSummaryCards({ items }: ScheduleSummaryCardsProps) {
    return (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {items.map((item) => (
                <div
                    key={item.label}
                    className="rounded-lg border border-sidebar-border/70 bg-card p-4 shadow-sm"
                >
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <p className="text-sm font-medium text-muted-foreground">{item.label}</p>
                            <p className="mt-2 truncate text-2xl font-semibold text-foreground">{item.value}</p>
                        </div>
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/8 text-primary">
                            {item.icon ?? <CalendarDays className="size-5" />}
                        </div>
                    </div>
                    {item.caption ? (
                        <p className="mt-3 line-clamp-2 min-h-5 text-sm text-muted-foreground">
                            {item.caption}
                        </p>
                    ) : null}
                </div>
            ))}
        </div>
    );
}

export function buildScheduleSummaries(
    events: ScheduleCalendarEvent[],
    audience: ScheduleAudience,
): ScheduleSummaryItem[] {
    const uniqueSubjects = uniqueValues(events, 'subject_name');
    const uniqueClasses = uniqueValues(events, 'class_name');
    const uniqueTeachers = uniqueValues(events, 'teacher_name');
    const nextEvent = getNextEvent(events);
    const busiestDay = getBusiestDay(events);
    const totalHours = sumEventHours(events);

    if (audience === 'student') {
        return [
            {
                label: 'Courses this week',
                value: String(events.length),
                caption: 'Scheduled sessions in the current view',
                icon: <CalendarDays className="size-5" />,
            },
            {
                label: 'Subjects',
                value: String(uniqueSubjects.length),
                caption: uniqueSubjects.slice(0, 2).join(', ') || 'No subject yet',
                icon: <BookOpen className="size-5" />,
            },
            {
                label: 'Next lesson',
                value: nextEvent ? eventTimeRange(nextEvent) : '-',
                caption: nextEvent ? eventPrimaryLabel(nextEvent, 'student') : 'No upcoming lesson',
                icon: <Clock className="size-5" />,
            },
            {
                label: 'Busiest day',
                value: busiestDay.day,
                caption: busiestDay.count > 0 ? `${busiestDay.count} course(s)` : 'No sessions this week',
                icon: <Layers className="size-5" />,
            },
        ];
    }

    if (audience === 'teacher') {
        return [
            {
                label: 'Sessions this week',
                value: String(events.length),
                caption: 'Teaching sessions in the current view',
                icon: <CalendarDays className="size-5" />,
            },
            {
                label: 'Classes taught',
                value: String(uniqueClasses.length),
                caption: uniqueClasses.slice(0, 2).join(', ') || 'No class yet',
                icon: <GraduationCap className="size-5" />,
            },
            {
                label: 'Next class',
                value: nextEvent ? eventTimeRange(nextEvent) : '-',
                caption: nextEvent ? eventPrimaryLabel(nextEvent, 'teacher') : 'No upcoming class',
                icon: <Clock className="size-5" />,
            },
            {
                label: 'Teaching hours',
                value: `${formatNumber(totalHours)}h`,
                caption: 'Total planned time this week',
                icon: <BookOpen className="size-5" />,
            },
        ];
    }

    return [
        {
            label: 'Sessions this week',
            value: String(events.length),
            caption: 'Total sessions in the filtered calendar',
            icon: <CalendarDays className="size-5" />,
        },
        {
            label: 'Classes',
            value: String(uniqueClasses.length),
            caption: uniqueClasses.slice(0, 2).join(', ') || 'No class selected',
            icon: <GraduationCap className="size-5" />,
        },
        {
            label: 'Teachers scheduled',
            value: String(uniqueTeachers.length),
            caption: uniqueTeachers.slice(0, 2).join(', ') || 'No teacher selected',
            icon: <Users className="size-5" />,
        },
        {
            label: 'Subjects',
            value: String(uniqueSubjects.length),
            caption: uniqueSubjects.slice(0, 2).join(', ') || 'No subject selected',
            icon: <BookOpen className="size-5" />,
        },
    ];
}

export function colorizeScheduleEvents(
    events: ScheduleCalendarEvent[],
    keyName: keyof ScheduleEventProps,
): ScheduleCalendarEvent[] {
    const colorMap = new Map<string, (typeof colorPalette)[number]>();

    return events.map((event) => {
        const key = String(event.extendedProps?.[keyName] ?? event.title ?? event.id ?? 'schedule');

        if (!colorMap.has(key)) {
            colorMap.set(key, colorPalette[colorMap.size % colorPalette.length]);
        }

        const color = colorMap.get(key) ?? colorPalette[0];

        return {
            ...event,
            backgroundColor: color.background,
            borderColor: color.border,
            textColor: color.text,
        };
    });
}

export function eventPrimaryLabel(event: ScheduleCalendarEvent, audience: ScheduleAudience): string {
    const props = event.extendedProps ?? {};
    const subject = props.subject_name ?? event.title ?? 'Schedule';

    if (audience === 'student') {
        return [subject, props.teacher_name].filter(Boolean).join(' with ');
    }

    if (audience === 'teacher') {
        return [subject, props.class_name].filter(Boolean).join(' - ');
    }

    return [subject, props.class_name, props.teacher_name].filter(Boolean).join(' - ');
}

export function eventTimeRange(event: ScheduleCalendarEvent): string {
    const props = event.extendedProps ?? {};

    if (props.start_time && props.end_time) {
        return `${props.start_time}-${props.end_time}`;
    }

    if (event.start instanceof Date && event.end instanceof Date) {
        return `${formatTime(event.start)}-${formatTime(event.end)}`;
    }

    return '-';
}

export function eventSecondaryLine(event: ScheduleCalendarEvent, audience: ScheduleAudience): string {
    const props = event.extendedProps ?? {};
    const details =
        audience === 'student'
            ? [props.teacher_name, props.room_name]
            : audience === 'teacher'
                ? [props.class_name, props.room_name]
                : [props.class_name, props.teacher_name, props.room_name];

    return details.filter(Boolean).join(' - ');
}

export function legendItems(events: ScheduleCalendarEvent[], keyName: keyof ScheduleEventProps) {
    const seen = new Set<string>();

    return colorizeScheduleEvents(events, keyName)
        .map((event) => ({
            label: String(event.extendedProps?.[keyName] ?? event.title ?? 'Schedule'),
            color: String(event.borderColor ?? '#2563eb'),
        }))
        .filter((item) => {
            if (seen.has(item.label)) {
                return false;
            }

            seen.add(item.label);

            return true;
        })
        .slice(0, 8);
}

export function EmptyScheduleState({ title, description }: { title: string; description: string }) {
    return (
        <div className="rounded-lg border border-dashed border-sidebar-border/80 bg-muted/20 px-4 py-8 text-center">
            <div className="mx-auto flex size-11 items-center justify-center rounded-md bg-background text-muted-foreground">
                <CalendarDays className="size-5" />
            </div>
            <h3 className="mt-3 text-sm font-semibold text-foreground">{title}</h3>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">{description}</p>
        </div>
    );
}

export function FilterSelect({
    value,
    onChange,
    options,
    placeholder,
    className,
}: {
    value: string;
    onChange: (value: string) => void;
    options: string[];
    placeholder: string;
    className?: string;
}) {
    return (
        <select
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className={cn(
                'border-input focus-visible:border-ring focus-visible:ring-ring/50 h-9 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-[3px]',
                className,
            )}
        >
            <option value="">{placeholder}</option>
            {options.map((option) => (
                <option key={option} value={option}>
                    {option}
                </option>
            ))}
        </select>
    );
}

function uniqueValues(events: ScheduleCalendarEvent[], key: keyof ScheduleEventProps): string[] {
    return Array.from(
        new Set(
            events
                .map((event) => event.extendedProps?.[key])
                .filter((value): value is string | number => value !== null && value !== undefined && value !== ''),
        ),
    ).map(String);
}

function getNextEvent(events: ScheduleCalendarEvent[]): ScheduleCalendarEvent | null {
    const now = Date.now();

    return (
        events
            .filter((event) => {
                const start = event.start instanceof Date ? event.start.getTime() : Date.parse(String(event.start ?? ''));

                return Number.isFinite(start) && start >= now;
            })
            .sort((first, second) => {
                const firstStart = first.start instanceof Date ? first.start.getTime() : Date.parse(String(first.start ?? ''));
                const secondStart = second.start instanceof Date ? second.start.getTime() : Date.parse(String(second.start ?? ''));

                return firstStart - secondStart;
            })[0] ?? null
    );
}

function getBusiestDay(events: ScheduleCalendarEvent[]): { day: string; count: number } {
    const counts = new Map<string, number>();

    events.forEach((event) => {
        const day = String(event.extendedProps?.day_of_week ?? '');

        if (day) {
            counts.set(day, (counts.get(day) ?? 0) + 1);
        }
    });

    const [day, count] =
        Array.from(counts.entries()).sort((first, second) => {
            if (second[1] !== first[1]) {
                return second[1] - first[1];
            }

            return dayOrder.indexOf(first[0]) - dayOrder.indexOf(second[0]);
        })[0] ?? ['-', 0];

    return { day, count };
}

function sumEventHours(events: ScheduleCalendarEvent[]): number {
    return events.reduce((total, event) => {
        const start = event.start instanceof Date ? event.start.getTime() : Date.parse(String(event.start ?? ''));
        const end = event.end instanceof Date ? event.end.getTime() : Date.parse(String(event.end ?? ''));

        if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
            return total;
        }

        return total + (end - start) / 3_600_000;
    }, 0);
}

function formatTime(date: Date): string {
    return new Intl.DateTimeFormat('en', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    }).format(date);
}

function formatNumber(value: number): string {
    return Number.isInteger(value) ? String(value) : value.toFixed(1);
}
