import { router, useForm } from '@inertiajs/react';
import { Save, Trash2, X } from 'lucide-react';
import AlertError from '@/components/alert-error';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Option = {
    id: number;
    name: string;
};

export type ScheduleModalData = {
    id: number | null;
    class_id: string;
    subject_id: string;
    teacher_id: string;
    day_of_week: string;
    start_time: string;
    end_time: string;
};

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialData: ScheduleModalData;
    classes: Option[];
    subjects: Option[];
    teachers: Option[];
    dayOptions: string[];
    onSaved: () => void;
};

const selectClassName =
    'border-input focus-visible:border-ring focus-visible:ring-ring/50 h-9 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-[3px]';

export default function ScheduleFormModal({
    open,
    onOpenChange,
    initialData,
    classes,
    subjects,
    teachers,
    dayOptions,
    onSaved,
}: Props) {
    const form = useForm<ScheduleModalData>(initialData);
    const isEditing = initialData.id !== null;
    const errorMessages = Object.values(form.errors).filter(Boolean) as string[];

    const handleSubmit = () => {
        const options = {
            preserveScroll: true,
            onSuccess: () => {
                onSaved();
                onOpenChange(false);
            },
        };

        if (isEditing && form.data.id) {
            form.put(`/establishment-admin/schedules/${form.data.id}`, options);

            return;
        }

        form.post('/establishment-admin/schedules', options);
    };

    const handleDelete = () => {
        if (!form.data.id || !window.confirm('Delete this schedule?')) {
            return;
        }

        router.delete(`/establishment-admin/schedules/${form.data.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                onSaved();
                onOpenChange(false);
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{isEditing ? 'Edit schedule' : 'Create schedule'}</DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? 'Update the selected teaching session.'
                            : 'Create a new teaching session directly from the calendar.'}
                    </DialogDescription>
                </DialogHeader>

                {errorMessages.length > 0 ? (
                    <AlertError
                        title="Unable to save this schedule."
                        errors={errorMessages}
                    />
                ) : null}

                <div className="grid gap-4 rounded-lg border border-border bg-muted/20 p-4 md:grid-cols-2">
                    <div className="grid gap-2">
                        <Label htmlFor="modal_class_id">Class</Label>
                        <select
                            id="modal_class_id"
                            value={form.data.class_id}
                            onChange={(event) => form.setData('class_id', event.target.value)}
                            className={selectClassName}
                        >
                            <option value="">Select a class</option>
                            {classes.map((schoolClass) => (
                                <option key={schoolClass.id} value={String(schoolClass.id)}>
                                    {schoolClass.name}
                                </option>
                            ))}
                        </select>
                        <InputError message={form.errors.class_id} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="modal_subject_id">Subject</Label>
                        <select
                            id="modal_subject_id"
                            value={form.data.subject_id}
                            onChange={(event) => form.setData('subject_id', event.target.value)}
                            className={selectClassName}
                        >
                            <option value="">Select a subject</option>
                            {subjects.map((subject) => (
                                <option key={subject.id} value={String(subject.id)}>
                                    {subject.name}
                                </option>
                            ))}
                        </select>
                        <InputError message={form.errors.subject_id} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="modal_teacher_id">Teacher</Label>
                        <select
                            id="modal_teacher_id"
                            value={form.data.teacher_id}
                            onChange={(event) => form.setData('teacher_id', event.target.value)}
                            className={selectClassName}
                        >
                            <option value="">Select a teacher</option>
                            {teachers.map((teacher) => (
                                <option key={teacher.id} value={String(teacher.id)}>
                                    {teacher.name}
                                </option>
                            ))}
                        </select>
                        <InputError message={form.errors.teacher_id} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="modal_day_of_week">Day</Label>
                        <select
                            id="modal_day_of_week"
                            value={form.data.day_of_week}
                            onChange={(event) => form.setData('day_of_week', event.target.value)}
                            className={selectClassName}
                        >
                            <option value="">Select a day</option>
                            {dayOptions.map((day) => (
                                <option key={day} value={day}>
                                    {day}
                                </option>
                            ))}
                        </select>
                        <InputError message={form.errors.day_of_week} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="modal_start_time">Start time</Label>
                        <Input
                            id="modal_start_time"
                            type="time"
                            value={form.data.start_time}
                            onChange={(event) => form.setData('start_time', event.target.value)}
                        />
                        <InputError message={form.errors.start_time} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="modal_end_time">End time</Label>
                        <Input
                            id="modal_end_time"
                            type="time"
                            value={form.data.end_time}
                            onChange={(event) => form.setData('end_time', event.target.value)}
                        />
                        <InputError message={form.errors.end_time} />
                    </div>
                </div>

                <DialogFooter className="items-center justify-between sm:justify-between">
                    <div>
                        {isEditing ? (
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={handleDelete}
                            >
                                <Trash2 className="size-4" />
                                Delete
                            </Button>
                        ) : null}
                    </div>

                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            <X className="size-4" />
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            disabled={form.processing}
                            onClick={handleSubmit}
                        >
                            <Save className="size-4" />
                            {isEditing ? 'Save changes' : 'Create schedule'}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
