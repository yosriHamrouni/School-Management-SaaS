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

type Props = {
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
        title: 'Create',
        href: '/establishment-admin/schedules/create',
    },
];

const initialData: ScheduleFormData = {
    class_id: '',
    subject_id: '',
    teacher_id: '',
    day_of_week: '',
    start_time: '',
    end_time: '',
};

export default function SchedulesCreate(props: Props) {
    const form = useForm<ScheduleFormData>(initialData);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Schedule" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div className="rounded-xl border border-sidebar-border/70 bg-background p-6">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-semibold">Create Schedule</h1>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Plan a new teaching session for your establishment.
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
                        submitLabel="Create schedule"
                        classes={props.classes}
                        subjects={props.subjects}
                        teachers={props.teachers}
                        dayOptions={props.dayOptions}
                        setData={form.setData}
                        onSubmit={(event) => {
                            event.preventDefault();
                            form.post('/establishment-admin/schedules');
                        }}
                    />
                </div>
            </div>
        </AppLayout>
    );
}
