import type { FormEvent } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Option = {
    id: number;
    name: string;
};

type ClassFormData = {
    name: string;
    level_id: string;
    academic_year_id: string;
};

type ClassFormProps = {
    data: ClassFormData;
    errors: Record<string, string | undefined>;
    processing: boolean;
    submitLabel: string;
    levels: Option[];
    academicYears: Option[];
    setData: {
        (key: 'name', value: string): void;
        (key: 'level_id', value: string): void;
        (key: 'academic_year_id', value: string): void;
    };
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export default function ClassForm({
    data,
    errors,
    processing,
    submitLabel,
    levels,
    academicYears,
    setData,
    onSubmit,
}: ClassFormProps) {
    return (
        <form onSubmit={onSubmit} className="grid gap-6">
            <div className="grid gap-6 md:grid-cols-2">
                <div className="grid gap-2 md:col-span-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                        id="name"
                        value={data.name}
                        onChange={(event) => setData('name', event.target.value)}
                        placeholder="Class A"
                    />
                    <InputError message={errors.name} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="level_id">Level</Label>
                    <select
                        id="level_id"
                        value={data.level_id}
                        onChange={(event) =>
                            setData('level_id', event.target.value)
                        }
                        className="border-input focus-visible:border-ring focus-visible:ring-ring/50 h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus-visible:ring-[3px]"
                    >
                        <option value="">Select a level</option>
                        {levels.map((level) => (
                            <option key={level.id} value={String(level.id)}>
                                {level.name}
                            </option>
                        ))}
                    </select>
                    <InputError message={errors.level_id} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="academic_year_id">Academic Year</Label>
                    <select
                        id="academic_year_id"
                        value={data.academic_year_id}
                        onChange={(event) =>
                            setData('academic_year_id', event.target.value)
                        }
                        className="border-input focus-visible:border-ring focus-visible:ring-ring/50 h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus-visible:ring-[3px]"
                    >
                        <option value="">Select an academic year</option>
                        {academicYears.map((academicYear) => (
                            <option
                                key={academicYear.id}
                                value={String(academicYear.id)}
                            >
                                {academicYear.name}
                            </option>
                        ))}
                    </select>
                    <InputError message={errors.academic_year_id} />
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
