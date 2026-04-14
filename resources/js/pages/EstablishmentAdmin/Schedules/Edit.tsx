import { Head, Link, useForm } from '@inertiajs/react';
import ScheduleForm from '@/components/establishment-admin/schedule-form';
import type { ScheduleFormData } from '@/components/establishment-admin/schedule-form';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type Option = {
    id: number;
    name: string;
};

type Schedule = ScheduleFormData & {
    id: number;
};

type Props = {
    schedule: Schedule;
    classes: Option[];
    subjects: Option[];
    teachers: Option[];
    dayOptions: string[];
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Schedules',
        href: '/establishment-admin/schedules',
    },
    {
        title: 'Edit',
        href: '#',
    },
];

export default function SchedulesEdit(props: Props) {
    const form = useForm<ScheduleFormData>({
        class_id: String(props.schedule.class_id),
        subject_id: String(props.schedule.subject_id),
        teacher_id: String(props.schedule.teacher_id),
        day_of_week: props.schedule.day_of_week,
        start_time: props.schedule.start_time,
        end_time: props.schedule.end_time,
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Schedule" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div className="rounded-xl border border-sidebar-border/70 bg-background p-6">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-semibold">Edit Schedule</h1>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Update the selected teaching session.
                            </p>
                        </div>

                        <Button variant="outline" asChild>
                            <Link href="/establishment-admin/schedules">Back to list</Link>
                        </Button>
                    </div>
                </div>

                <div className="rounded-xl border border-sidebar-border/70 bg-background p-6">
                    <ScheduleForm
                        data={form.data}
                        errors={form.errors}
                        processing={form.processing}
                        submitLabel="Save changes"
                        classes={props.classes}
                        subjects={props.subjects}
                        teachers={props.teachers}
                        dayOptions={props.dayOptions}
                        setData={form.setData}
                        onSubmit={(event) => {
                            event.preventDefault();
                            form.put(`/establishment-admin/schedules/${props.schedule.id}`);
                        }}
                    />
                </div>
            </div>
        </AppLayout>
    );
}
