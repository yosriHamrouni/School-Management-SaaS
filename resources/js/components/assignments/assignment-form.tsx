import type { FormEvent } from 'react';
import { useMemo } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export type AssignmentFormData = {
    class_id: string;
    subject_id: string;
    title: string;
    description: string;
    due_date: string;
};

type AssignmentOption = {
    class_id: number;
    subject_id: number;
    label: string;
};

type Props = {
    data: AssignmentFormData;
    errors: Record<string, string | undefined>;
    processing: boolean;
    submitLabel: string;
    assignmentOptions: AssignmentOption[];
    activeAcademicYear?: {
        id: number;
        name: string;
    } | null;
    setData: (key: keyof AssignmentFormData, value: string) => void;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

const selectClassName =
    'border-input focus-visible:border-ring focus-visible:ring-ring/50 h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus-visible:ring-[3px]';

export default function AssignmentForm({
    data,
    errors,
    processing,
    submitLabel,
    assignmentOptions,
    activeAcademicYear,
    setData,
    onSubmit,
}: Props) {
    const classOptions = useMemo(() => {
        const seen = new Map<number, string>();

        assignmentOptions.forEach((assignment) => {
            if (! seen.has(assignment.class_id)) {
                seen.set(assignment.class_id, assignment.label.split(' - ')[0] ?? assignment.label);
            }
        });

        return Array.from(seen.entries()).map(([id, name]) => ({ id, name }));
    }, [assignmentOptions]);

    const subjectOptions = useMemo(() => {
        const relevantAssignments = data.class_id
            ? assignmentOptions.filter((assignment) => String(assignment.class_id) === data.class_id)
            : assignmentOptions;

        const seen = new Map<number, string>();

        relevantAssignments.forEach((assignment) => {
            const subjectName = assignment.label.split(' - ')[1] ?? assignment.label;

            if (! seen.has(assignment.subject_id)) {
                seen.set(assignment.subject_id, subjectName);
            }
        });

        return Array.from(seen.entries()).map(([id, name]) => ({ id, name }));
    }, [assignmentOptions, data.class_id]);

    return (
        <form onSubmit={onSubmit} className="grid gap-6">
            {activeAcademicYear ? (
                <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                    Active academic year: <span className="font-medium text-foreground">{activeAcademicYear.name}</span>
                </div>
            ) : (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    No active academic year is configured for your establishment.
                </div>
            )}

            <div className="grid gap-6 md:grid-cols-2">
                <div className="grid gap-2">
                    <Label htmlFor="class_id">Class</Label>
                    <select
                        id="class_id"
                        value={data.class_id}
                        onChange={(event) => {
                            setData('class_id', event.target.value);
                            setData('subject_id', '');
                        }}
                        className={selectClassName}
                    >
                        <option value="">Select a class</option>
                        {classOptions.map((option) => (
                            <option key={option.id} value={String(option.id)}>
                                {option.name}
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
                        {subjectOptions.map((option) => (
                            <option key={option.id} value={String(option.id)}>
                                {option.name}
                            </option>
                        ))}
                    </select>
                    <InputError message={errors.subject_id} />
                </div>

                <div className="grid gap-2 md:col-span-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                        id="title"
                        value={data.title}
                        onChange={(event) => setData('title', event.target.value)}
                        placeholder="Homework 1"
                    />
                    <InputError message={errors.title} />
                </div>

                <div className="grid gap-2 md:col-span-2">
                    <Label htmlFor="description">Description</Label>
                    <textarea
                        id="description"
                        value={data.description}
                        onChange={(event) => setData('description', event.target.value)}
                        className="border-input focus-visible:border-ring focus-visible:ring-ring/50 min-h-32 rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-[3px]"
                        placeholder="Assignment instructions for the class"
                    />
                    <InputError message={errors.description} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="due_date">Due date</Label>
                    <Input
                        id="due_date"
                        type="date"
                        value={data.due_date}
                        onChange={(event) => setData('due_date', event.target.value)}
                    />
                    <InputError message={errors.due_date} />
                </div>
            </div>

            <div className="flex justify-end">
                <Button type="submit" disabled={processing || ! activeAcademicYear}>
                    {submitLabel}
                </Button>
            </div>
        </form>
    );
}
