import type { FormEvent } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Option = {
    id: number;
    name: string;
};

export type ScheduleFormData = {
    class_id: string;
    subject_id: string;
    teacher_id: string;
    day_of_week: string;
    start_time: string;
    end_time: string;
};

type ScheduleFormProps = {
    data: ScheduleFormData;
    errors: Record<string, string | undefined>;
    processing: boolean;
    submitLabel: string;
    classes: Option[];
    subjects: Option[];
    teachers: Option[];
    dayOptions: string[];
    setData: {
        (key: keyof ScheduleFormData, value: string): void;
    };
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

const selectClassName =
    'border-input focus-visible:border-ring focus-visible:ring-ring/50 h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus-visible:ring-[3px]';

export default function ScheduleForm({
    data,
    errors,
    processing,
    submitLabel,
    classes,
    subjects,
    teachers,
    dayOptions,
    setData,
    onSubmit,
}: ScheduleFormProps) {
    return (
        <form onSubmit={onSubmit} className="grid gap-6">
            <div className="grid gap-6 md:grid-cols-2">
                <div className="grid gap-2">
                    <Label htmlFor="class_id">Class</Label>
                    <select
                        id="class_id"
                        value={data.class_id}
                        onChange={(event) => setData('class_id', event.target.value)}
                        className={selectClassName}
                    >
                        <option value="">Select a class</option>
                        {classes.map((schoolClass) => (
                            <option key={schoolClass.id} value={String(schoolClass.id)}>
                                {schoolClass.name}
                            </option>
                        ))}
                    </select>
                    <InputError message={errors.class_id} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="subject_id">Subject</Label>
                    <select
                        id="subject_id"
                        value={data.subject_id}
                        onChange={(event) => setData('subject_id', event.target.value)}
                        className={selectClassName}
                    >
                        <option value="">Select a subject</option>
                        {subjects.map((subject) => (
                            <option key={subject.id} value={String(subject.id)}>
                                {subject.name}
                            </option>
                        ))}
                    </select>
                    <InputError message={errors.subject_id} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="teacher_id">Teacher</Label>
                    <select
                        id="teacher_id"
                        value={data.teacher_id}
                        onChange={(event) => setData('teacher_id', event.target.value)}
                        className={selectClassName}
                    >
                        <option value="">Select a teacher</option>
                        {teachers.map((teacher) => (
                            <option key={teacher.id} value={String(teacher.id)}>
                                {teacher.name}
                            </option>
                        ))}
                    </select>
                    <InputError message={errors.teacher_id} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="day_of_week">Day</Label>
                    <select
                        id="day_of_week"
                        value={data.day_of_week}
                        onChange={(event) => setData('day_of_week', event.target.value)}
                        className={selectClassName}
                    >
                        <option value="">Select a day</option>
                        {dayOptions.map((day) => (
                            <option key={day} value={day}>
                                {day}
                            </option>
                        ))}
                    </select>
                    <InputError message={errors.day_of_week} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="start_time">Start time</Label>
                    <Input
                        id="start_time"
                        type="time"
                        value={data.start_time}
                        onChange={(event) => setData('start_time', event.target.value)}
                    />
                    <InputError message={errors.start_time} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="end_time">End time</Label>
                    <Input
                        id="end_time"
                        type="time"
                        value={data.end_time}
                        onChange={(event) => setData('end_time', event.target.value)}
                    />
                    <InputError message={errors.end_time} />
                </div>
            </div>

            <div className="flex justify-end">
                <Button type="submit" disabled={processing}>
                    {submitLabel}
                </Button>
            </div>
        </form>
    );
}
