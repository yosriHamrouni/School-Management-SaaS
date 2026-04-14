import { useMemo, type FormEvent } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export type EvaluationFormData = {
    title: string;
    class_id: string;
    subject_id: string;
    term_id: string;
    type: string;
    coefficient: string;
    max_grade: string;
    evaluation_date: string;
    description: string;
};

type AssignmentOption = {
    class_id: number;
    subject_id: number;
    teacher_id: number;
    label: string;
};

type TermOption = {
    id: number;
    name: string;
};

type Props = {
    data: EvaluationFormData;
    errors: Record<string, string | undefined>;
    processing: boolean;
    submitLabel: string;
    assignments: AssignmentOption[];
    terms: TermOption[];
    setData: (key: keyof EvaluationFormData, value: string) => void;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

const selectClassName =
    'border-input focus-visible:border-ring focus-visible:ring-ring/50 h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus-visible:ring-[3px]';

export default function EvaluationForm({
    data,
    errors,
    processing,
    submitLabel,
    assignments,
    terms,
    setData,
    onSubmit,
}: Props) {
    const classOptions = useMemo(() => {
        const seen = new Map<number, string>();

        assignments.forEach((assignment) => {
            if (!seen.has(assignment.class_id)) {
                seen.set(assignment.class_id, assignment.label.split(' - ')[0] ?? assignment.label);
            }
        });

        return Array.from(seen.entries()).map(([id, name]) => ({ id, name }));
    }, [assignments]);

    const subjectOptions = useMemo(() => {
        const relevantAssignments = data.class_id
            ? assignments.filter((assignment) => String(assignment.class_id) === data.class_id)
            : assignments;

        const seen = new Map<number, string>();

        relevantAssignments.forEach((assignment) => {
            const labelParts = assignment.label.split(' - ');
            const subjectName = labelParts[1]?.split(' (')[0] ?? assignment.label;

            if (!seen.has(assignment.subject_id)) {
                seen.set(assignment.subject_id, subjectName);
            }
        });

        return Array.from(seen.entries()).map(([id, name]) => ({ id, name }));
    }, [assignments, data.class_id]);

    return (
        <form onSubmit={onSubmit} className="grid gap-6">
            <div className="grid gap-6 md:grid-cols-2">
                <div className="grid gap-2 md:col-span-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                        id="title"
                        value={data.title}
                        onChange={(event) => setData('title', event.target.value)}
                        placeholder="Quiz 1"
                    />
                    <InputError message={errors.title} />
                </div>

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

                <div className="grid gap-2">
                    <Label htmlFor="term_id">Term</Label>
                    <select
                        id="term_id"
                        value={data.term_id}
                        onChange={(event) => setData('term_id', event.target.value)}
                        className={selectClassName}
                    >
                        <option value="">Select a term</option>
                        {terms.map((term) => (
                            <option key={term.id} value={String(term.id)}>
                                {term.name}
                            </option>
                        ))}
                    </select>
                    <InputError message={errors.term_id} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="type">Type</Label>
                    <Input
                        id="type"
                        value={data.type}
                        onChange={(event) => setData('type', event.target.value)}
                        placeholder="exam"
                    />
                    <InputError message={errors.type} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="coefficient">Coefficient</Label>
                    <Input
                        id="coefficient"
                        type="number"
                        step="0.01"
                        min="0"
                        value={data.coefficient}
                        onChange={(event) => setData('coefficient', event.target.value)}
                    />
                    <InputError message={errors.coefficient} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="max_grade">Max grade</Label>
                    <Input
                        id="max_grade"
                        type="number"
                        step="0.01"
                        min="0"
                        value={data.max_grade}
                        onChange={(event) => setData('max_grade', event.target.value)}
                    />
                    <InputError message={errors.max_grade} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="evaluation_date">Evaluation date</Label>
                    <Input
                        id="evaluation_date"
                        type="date"
                        value={data.evaluation_date}
                        onChange={(event) => setData('evaluation_date', event.target.value)}
                    />
                    <InputError message={errors.evaluation_date} />
                </div>

                <div className="grid gap-2 md:col-span-2">
                    <Label htmlFor="description">Description</Label>
                    <textarea
                        id="description"
                        value={data.description}
                        onChange={(event) => setData('description', event.target.value)}
                        className="border-input focus-visible:border-ring focus-visible:ring-ring/50 min-h-28 rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-[3px]"
                        placeholder="Optional instructions or grading notes"
                    />
                    <InputError message={errors.description} />
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
