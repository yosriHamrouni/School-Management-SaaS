import type { FormEvent } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type SubjectFormData = {
    name: string;
};

type SubjectFormProps = {
    data: SubjectFormData;
    errors: Record<string, string | undefined>;
    processing: boolean;
    submitLabel: string;
    setData: {
        (key: 'name', value: string): void;
    };
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export default function SubjectForm({
    data,
    errors,
    processing,
    submitLabel,
    setData,
    onSubmit,
}: SubjectFormProps) {
    return (
        <form onSubmit={onSubmit} className="grid gap-6">
            <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                    id="name"
                    value={data.name}
                    onChange={(event) => setData('name', event.target.value)}
                    placeholder="Mathematics"
                />
                <InputError message={errors.name} />
            </div>

            <div className="flex justify-end">
                <Button type="submit" disabled={processing}>
                    {submitLabel}
                </Button>
            </div>
        </form>
    );
}
