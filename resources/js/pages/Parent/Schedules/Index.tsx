import { Head, router } from '@inertiajs/react';
import ScheduleCalendar from '@/pages/EstablishmentAdmin/Schedules/Partials/ScheduleCalendar';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type ChildOption = {
    id: number;
    name: string | null;
    student_number: string | null;
    class_name: string | null;
};

type Props = {
    children: ChildOption[];
    selectedChildId: number | null;
    selectedChild: ChildOption | null;
    calendarFeedUrl: string | null;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Parent Area', href: '/dashboard' },
    { title: 'Child Schedule', href: '#' },
];

const selectClassName =
    'border-input focus-visible:border-ring focus-visible:ring-ring/50 h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus-visible:ring-[3px]';

export default function ParentSchedulesIndex({
    children,
    selectedChildId,
    selectedChild,
    calendarFeedUrl,
}: Props) {
    const handleChildChange = (childId: string) => {
        if (!childId) {
            router.get('/parent/schedules', {}, { preserveScroll: true });
            return;
        }

        router.get(`/parent/schedules/${childId}`, {}, { preserveScroll: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Child Schedule" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div className="rounded-xl border border-sidebar-border/70 bg-background p-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h1 className="text-2xl font-semibold">Child Schedule</h1>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Review the weekly timetable only for children linked to your account.
                            </p>
                        </div>

                        <select
                            value={selectedChildId ?? ''}
                            onChange={(event) => handleChildChange(event.target.value)}
                            className={selectClassName}
                        >
                            <option value="">Select a child</option>
                            {children.map((child) => (
                                <option key={child.id} value={String(child.id)}>
                                    {child.name} {child.student_number ? `- ${child.student_number}` : ''}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {children.length === 0 ? (
                    <div className="rounded-xl border border-sidebar-border/70 bg-background px-6 py-8 text-sm text-muted-foreground">
                        No child is linked to your parent account yet.
                    </div>
                ) : null}

                {selectedChild ? (
                    <div className="rounded-xl border border-sidebar-border/70 bg-background p-6">
                        <h2 className="text-lg font-semibold">{selectedChild.name ?? 'Student'}</h2>
                        <p className="mt-2 text-sm text-muted-foreground">
                            {selectedChild.class_name
                                ? `Read-only weekly timetable for ${selectedChild.class_name}.`
                                : 'No class is currently assigned to this student profile.'}
                        </p>
                    </div>
                ) : null}

                {calendarFeedUrl ? <ScheduleCalendar feedUrl={calendarFeedUrl} readOnly /> : null}
            </div>
        </AppLayout>
    );
}
