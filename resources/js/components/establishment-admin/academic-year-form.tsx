import type { FormEvent } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type AcademicYearFormData = {
    name: string;
    start_date: string;
    end_date: string;
    status: 'active' | 'inactive';
    is_current: boolean;
};

type AcademicYearFormProps = {
    data: AcademicYearFormData;
    errors: Record<string, string | undefined>;
    processing: boolean;
    submitLabel: string;
    setData: {
        (key: 'name', value: string): void;
        (key: 'start_date', value: string): void;
        (key: 'end_date', value: string): void;
        (key: 'status', value: 'active' | 'inactive'): void;
        (key: 'is_current', value: boolean): void;
    };
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export default function AcademicYearForm({
    data,
    errors,
    processing,
    submitLabel,
    setData,
    onSubmit,
}: AcademicYearFormProps) {
    return (
        <form onSubmit={onSubmit} className="grid gap-6">
            <div className="grid gap-6 md:grid-cols-2">
                <div className="grid gap-2 md:col-span-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                        id="name"
                        value={data.name}
                        onChange={(event) => setData('name', event.target.value)}
                        placeholder="2025 / 2026"
                    />
                    <InputError message={errors.name} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="start_date">Start Date</Label>
                    <Input
                        id="start_date"
                        type="date"
                        value={data.start_date}
                        onChange={(event) =>
                            setData('start_date', event.target.value)
                        }
                    />
                    <InputError message={errors.start_date} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="end_date">End Date</Label>
                    <Input
                        id="end_date"
                        type="date"
                        value={data.end_date}
                        onChange={(event) =>
                            setData('end_date', event.target.value)
                        }
                    />
                    <InputError message={errors.end_date} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="status">Status</Label>
                    <select
                        id="status"
                        value={data.status}
                        onChange={(event) =>
                            setData(
                                'status',
                                event.target.value as 'active' | 'inactive',
                            )
                        }
                        className="border-input focus-visible:border-ring focus-visible:ring-ring/50 h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus-visible:ring-[3px]"
                    >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                    <InputError message={errors.status} />
                </div>
            </div>

            <label className="flex items-center gap-3 rounded-lg border border-border px-4 py-3 text-sm text-foreground">
                <input
                    type="checkbox"
                    checked={data.is_current}
                    onChange={(event) =>
                        setData('is_current', event.target.checked)
                    }
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                <span>Set as current academic year</span>
            </label>
            <InputError message={errors.is_current} />

            <div className="flex justify-end">
                <Button type="submit" disabled={processing}>
                    {submitLabel}
                </Button>
            </div>
        </form>
    );
}
